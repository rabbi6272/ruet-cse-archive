import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// ============= AUTH CLIENT =============
async function createAuthClient() {
  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  ).trim();

  let auth;

  if (clientEmail && privateKey) {
    auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: SCOPES,
      forceRefreshOnFailure: true,
    });
  } else {
    const KEYFILEPATH = path.join(process.cwd(), "credentials.json");
    if (!fs.existsSync(KEYFILEPATH)) {
      throw new Error("Google Drive credentials not found");
    }
    auth = new google.auth.GoogleAuth({ keyFile: KEYFILEPATH, scopes: SCOPES });
  }

  return auth.getClient();
}

// ============= CACHED DRIVE FETCHER =============
// unstable_cache persists across requests in Vercel's data cache (not in-memory).
// revalidate: 600 = 10 minutes, matching your previous CACHE_TTL.
function getCachedDriveData(folderId) {
  return unstable_cache(
    async () => {
      const authClient = await createAuthClient();
      const drive = google.drive({ version: "v3", auth: authClient });

      const [folderInfo, filesResponse] = await Promise.all([
        drive.files.get({
          fileId: folderId,
          fields: "id, name, parents",
        }),
        drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields:
            "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime)",
          pageSize: 1000,
          orderBy: "name",
        }),
      ]);

      return {
        files: filesResponse.data.files || [],
        parentFolderId: folderInfo.data.parents?.[0] || null,
        currentFolder: {
          id: folderInfo.data.id,
          name: folderInfo.data.name,
        },
      };
    },
    [`drive_${folderId}`], // cache key — unique per folder
    { revalidate: 600 }, // 10 minutes, same as your old CACHE_TTL
  )();
}

// ============= MAIN API ROUTE =============
export async function POST(req) {
  let folderId, skipCache;

  try {
    const body = await req.json();
    folderId = body.folderId;
    skipCache = body.skipCache || false;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with folderId field." },
      { status: 400 },
    );
  }

  if (!folderId) {
    return NextResponse.json(
      { error: "Folder ID is required" },
      { status: 400 },
    );
  }

  try {
    // If skipCache is requested, bypass unstable_cache by calling Drive directly.
    // revalidateTag / revalidatePath can also be used for on-demand invalidation.
    let result;
    if (skipCache) {
      const authClient = await createAuthClient();
      const drive = google.drive({ version: "v3", auth: authClient });

      const [folderInfo, filesResponse] = await Promise.all([
        drive.files.get({ fileId: folderId, fields: "id, name, parents" }),
        drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields:
            "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime)",
          pageSize: 1000,
          orderBy: "name",
        }),
      ]);

      result = {
        files: filesResponse.data.files || [],
        parentFolderId: folderInfo.data.parents?.[0] || null,
        currentFolder: {
          id: folderInfo.data.id,
          name: folderInfo.data.name,
        },
      };
    } else {
      result = await getCachedDriveData(folderId);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache-Status": skipCache ? "SKIP" : "HIT_OR_MISS",
      },
    });
  } catch (err) {
    console.error("Google Drive API Error:", err);

    let errorMessage = "Failed to fetch files from Google Drive";
    let statusCode = 500;

    if (err.code === "ENOENT") {
      errorMessage = "Google Drive credentials file not found";
    } else if (err.code === 403 || err.response?.status === 403) {
      errorMessage = "Access denied. Check your Google Drive API permissions.";
      statusCode = 403;
    } else if (err.code === 404 || err.response?.status === 404) {
      errorMessage = "Folder not found or not accessible.";
      statusCode = 404;
    } else if (err.code === 429 || err.response?.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
      statusCode = 429;
    } else if (err.message?.includes("invalid_grant")) {
      errorMessage =
        "Authentication failed. Check your service account credentials and system time.";
    } else if (err.message?.includes("JWT")) {
      errorMessage =
        "JWT token error. Please regenerate your service account credentials.";
    } else if (err.message?.includes("credentials not found")) {
      errorMessage =
        "Google Drive credentials not found. Please add credentials.json or set environment variables.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      {
        status: statusCode,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      },
    );
  }
}
