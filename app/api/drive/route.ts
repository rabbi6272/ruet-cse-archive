import { NextResponse } from "next/server";
import { fetchDriveData } from "@/lib/drive-data";
import { getCachedDriveData } from "@/lib/drive-cache";

export async function POST(req: Request) {
  let folderId: string | undefined;

  try {
    const body = await req.json();
    folderId = body.folderId;
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
    const data = await getCachedDriveData(folderId, () =>
      fetchDriveData(folderId),
    );

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("Google Drive API Error:", err);

    let errorMessage = "Failed to fetch files from Google Drive";
    let statusCode = 500;

    const apiError = err as {
      code?: string | number;
      message?: string;
      response?: { status?: number };
    };

    if (apiError.code === "ENOENT") {
      errorMessage = "Google Drive credentials file not found";
    } else if (apiError.code === 403 || apiError.response?.status === 403) {
      errorMessage = "Access denied. Check your Google Drive API permissions.";
      statusCode = 403;
    } else if (apiError.code === 404 || apiError.response?.status === 404) {
      errorMessage = "Folder not found or not accessible.";
      statusCode = 404;
    } else if (apiError.code === 429 || apiError.response?.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
      statusCode = 429;
    } else if (apiError.message?.includes("invalid_grant")) {
      errorMessage =
        "Authentication failed. Check your service account credentials and system time.";
    } else if (apiError.message?.includes("JWT")) {
      errorMessage =
        "JWT token error. Please regenerate your service account credentials.";
    } else if (apiError.message?.includes("credentials not found")) {
      errorMessage =
        "Google Drive credentials not found. Please add credentials.json or set environment variables.";
    } else if (apiError.message) {
      errorMessage = apiError.message;
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

export async function GET() {
  const { getWatchInfo, getPageToken, getLastNotification } = await import(
    "@/lib/drive-meta"
  );

  let db: { ok: boolean; error?: string } = { ok: true };
  let watchInfo: Awaited<ReturnType<typeof getWatchInfo>> = null;
  let pageToken: string | null = null;
  let lastNotification: Awaited<ReturnType<typeof getLastNotification>> = null;

  try {
    [watchInfo, pageToken, lastNotification] = await Promise.all([
      getWatchInfo(),
      getPageToken(),
      getLastNotification(),
    ]);
  } catch (err) {
    db = { ok: false, error: (err as Error).message };
  }

  return NextResponse.json({
    storage: "next-cache (unstable_cache) + firebase-rtdb (drive/meta)",
    db,
    watch: watchInfo
      ? {
          channelId: watchInfo.channelId,
          expiration: watchInfo.expiration
            ? new Date(Number(watchInfo.expiration)).toISOString()
            : null,
          expired: watchInfo.expiration
            ? Date.now() > Number(watchInfo.expiration)
            : true,
        }
      : null,
    pageToken: pageToken ? "present" : "missing",
    lastNotification,
  });
}