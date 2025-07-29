import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const KEYFILEPATH = path.join(process.cwd(), "credentials.json");
    const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

    let auth;

    // Try environment variables first (more reliable for JWT issues)
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
      // Fallback to credentials file
      if (!fs.existsSync(KEYFILEPATH)) {
        return NextResponse.json(
          {
            error:
              "Google Drive credentials not found. Please add credentials.json or set environment variables.",
          },
          { status: 500 }
        );
      }

      auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
        forceRefreshOnFailure: true,
      });
    }

    // Extract folderId from the request body
    const { folderId } = await req.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Get auth client and ensure fresh token
    const authClient = await auth.getClient();

    const drive = google.drive({ version: "v3", auth: authClient });

    // Get current folder info
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: "id, name, parents",
    });

    // Build breadcrumb path
    const breadcrumb = [];
    let currentFolder = folderInfo.data;

    // Add current folder
    breadcrumb.unshift({
      id: currentFolder.id,
      name: currentFolder.name,
    });

    // Traverse up the parent hierarchy
    while (currentFolder.parents && currentFolder.parents.length > 0) {
      const parentId = currentFolder.parents[0];
      try {
        const parentInfo = await drive.files.get({
          fileId: parentId,
          fields: "id, name, parents",
        });

        breadcrumb.unshift({
          id: parentInfo.data.id,
          name: parentInfo.data.name,
        });

        currentFolder = parentInfo.data;
      } catch (err) {
        // If we can't access the parent (root or permission issue), break
        break;
      }
    }

    // Get files in the current folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, webContentLink)",
    });

    return NextResponse.json({
      files: response.data.files,
      breadcrumb: breadcrumb,
      currentFolder: {
        id: folderInfo.data.id,
        name: folderInfo.data.name,
      },
    });
  } catch (err) {
    console.error("Google Drive API Error:", err);

    let errorMessage = "Failed to fetch files from Google Drive";

    if (err.code === "ENOENT") {
      errorMessage = "Google Drive credentials file not found";
    } else if (err.code === 403) {
      errorMessage = "Access denied. Check your Google Drive API permissions.";
    } else if (err.code === 404) {
      errorMessage = "Folder not found or not accessible.";
    } else if (err.message && err.message.includes("invalid_grant")) {
      errorMessage =
        "Authentication failed. Please check your service account credentials and system time.";
    } else if (err.message && err.message.includes("JWT")) {
      errorMessage =
        "JWT token error. Please regenerate your service account credentials.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
