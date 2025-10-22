import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

// ============= CACHING LAYER =============
const cache = new Map();
const breadcrumbCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

// Clean old cache entries
function cleanCache(cacheMap) {
  if (cacheMap.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of cacheMap.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cacheMap.delete(key);
      }
    }
    // If still too large, delete oldest entries
    if (cacheMap.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cacheMap.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, cacheMap.size - MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => cacheMap.delete(key));
    }
  }
}

function getCacheKey(folderId) {
  return `drive_${folderId}`;
}

function getFromCache(key, cacheMap = cache) {
  const cached = cacheMap.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cacheMap.delete(key);
  return null;
}

function setCache(key, data, cacheMap = cache) {
  cleanCache(cacheMap);
  cacheMap.set(key, { data, timestamp: Date.now() });
}

// ============= AUTH CLIENT SINGLETON =============
let authClientCache = null;
let authClientTimestamp = 0;
const AUTH_CACHE_TTL = 50 * 60 * 1000; // 50 minutes (tokens last 1 hour)

async function getAuthClient() {
  const now = Date.now();

  // Return cached auth client if still valid
  if (authClientCache && now - authClientTimestamp < AUTH_CACHE_TTL) {
    return authClientCache;
  }

  const KEYFILEPATH = path.join(process.cwd(), "credentials.json");
  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

  let auth;

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: SCOPES,
      forceRefreshOnFailure: true,
    });
  } else {
    if (!fs.existsSync(KEYFILEPATH)) {
      throw new Error("Google Drive credentials not found");
    }

    auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
      forceRefreshOnFailure: true,
    });
  }

  authClientCache = await auth.getClient();
  authClientTimestamp = now;

  return authClientCache;
}

// ============= BREADCRUMB OPTIMIZATION =============
async function buildBreadcrumbOptimized(drive, folderId, folderName) {
  const cacheKey = `breadcrumb_${folderId}`;
  const cached = getFromCache(cacheKey, breadcrumbCache);

  if (cached) {
    return cached;
  }

  const breadcrumb = [{ id: folderId, name: folderName }];

  try {
    // Get folder info with parents
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: "parents",
    });

    if (!folderInfo.data.parents || folderInfo.data.parents.length === 0) {
      setCache(cacheKey, breadcrumb, breadcrumbCache);
      return breadcrumb;
    }

    // Collect all parent IDs up the chain
    const parentChain = [];
    let currentParentId = folderInfo.data.parents[0];
    const seenIds = new Set([folderId]);
    const MAX_DEPTH = 20; // Prevent infinite loops

    // First, collect all parent IDs
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      if (!currentParentId || seenIds.has(currentParentId)) break;

      seenIds.add(currentParentId);
      parentChain.push(currentParentId);

      // Check if this parent's info is already cached
      const parentCacheKey = `breadcrumb_${currentParentId}`;
      const cachedParent = getFromCache(parentCacheKey, breadcrumbCache);

      if (cachedParent) {
        // Use cached breadcrumb and stop traversing
        breadcrumb.unshift(...cachedParent);
        break;
      }

      // Fetch parent to get its parent
      try {
        const parentInfo = await drive.files.get({
          fileId: currentParentId,
          fields: "parents",
        });
        currentParentId = parentInfo.data.parents?.[0];
      } catch (err) {
        break;
      }
    }

    // Now batch fetch all parent names
    if (parentChain.length > 0) {
      const parentRequests = parentChain.map((parentId) =>
        drive.files
          .get({
            fileId: parentId,
            fields: "id, name",
          })
          .catch((err) => null)
      );

      const parentInfos = await Promise.all(parentRequests);

      // Add to breadcrumb in reverse order
      for (let i = parentInfos.length - 1; i >= 0; i--) {
        if (parentInfos[i]?.data) {
          breadcrumb.unshift({
            id: parentInfos[i].data.id,
            name: parentInfos[i].data.name,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error building breadcrumb:", err);
  }

  setCache(cacheKey, breadcrumb, breadcrumbCache);
  return breadcrumb;
}

// ============= MAIN API ROUTE =============
export async function POST(req) {
  try {
    const { folderId, skipCache = false } = await req.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(folderId);
    if (!skipCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return NextResponse.json(
          {
            ...cached,
            cached: true,
          },
          {
            headers: {
              "Cache-Control":
                "public, s-maxage=300, stale-while-revalidate=600",
              "X-Cache-Status": "HIT",
            },
          }
        );
      }
    }

    // Get reusable auth client
    const authClient = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // Parallel fetch: folder info + files list
    const [folderInfo, filesResponse] = await Promise.all([
      drive.files.get({
        fileId: folderId,
        fields: "id, name, parents",
      }),
      drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields:
          "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime)",
        pageSize: 1000, // Max allowed by Google Drive API
        orderBy: "folder,name", // Folders first, then alphabetically
      }),
    ]);

    // Build breadcrumb with optimized caching strategy
    const breadcrumb = await buildBreadcrumbOptimized(
      drive,
      folderInfo.data.id,
      folderInfo.data.name
    );

    const result = {
      files: filesResponse.data.files || [],
      breadcrumb: breadcrumb,
      currentFolder: {
        id: folderInfo.data.id,
        name: folderInfo.data.name,
      },
    };

    // Cache the result
    setCache(cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache-Status": "MISS",
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
    } else if (err.message && err.message.includes("invalid_grant")) {
      errorMessage =
        "Authentication failed. Please check your service account credentials and system time.";
    } else if (err.message && err.message.includes("JWT")) {
      errorMessage =
        "JWT token error. Please regenerate your service account credentials.";
    } else if (err.message?.includes("credentials not found")) {
      errorMessage =
        "Google Drive credentials not found. Please add credentials.json or set environment variables.";
      statusCode = 500;
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      {
        status: statusCode,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
