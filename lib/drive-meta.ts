import type { database } from "firebase-admin";

export interface WatchInfo {
  channelId: string;
  resourceId: string | null;
  expiration: string | null;
}

export interface LastNotification {
  at: string;
  state: string | null;
  messageNumber: string | null;
  channelId: string | null;
}

let adminDbCache: database.Database | null = null;

async function getAdminDb(): Promise<database.Database> {
  if (adminDbCache) return adminDbCache;
  const { adminDb } = await import("./firebase-admin");
  if (!adminDb) {
    throw new Error(
      "Firebase Admin (RTDB) is not available. The Drive cache system requires RTDB to persist page token + watch metadata.",
    );
  }
  adminDbCache = adminDb;
  return adminDbCache;
}

export async function getPageToken(): Promise<string | null> {
  const db = await getAdminDb();
  const snap = await db.ref("drive/meta/pageToken").once("value");
  const token = snap.val();
  return typeof token === "string" ? token : null;
}

export async function setPageToken(token: string): Promise<void> {
  const db = await getAdminDb();
  await db.ref("drive/meta/pageToken").set(token);
  console.log("[DriveMeta] Page token updated");
}

export async function getWatchInfo(): Promise<WatchInfo | null> {
  const db = await getAdminDb();
  const snap = await db.ref("drive/meta/watch").once("value");
  const val = snap.val();
  if (!val || typeof val !== "object") return null;
  return {
    channelId: val.channelId ?? "",
    resourceId: val.resourceId ?? null,
    expiration: val.expiration ? String(val.expiration) : null,
  };
}

export async function setWatchInfo({
  channelId,
  resourceId,
  expiration,
}: WatchInfo): Promise<void> {
  const db = await getAdminDb();
  await db
    .ref("drive/meta/watch")
    .set({ channelId, resourceId, expiration: String(expiration) });
  console.log(`[DriveMeta] Watch info stored: channel=${channelId}`);
}

export async function removeWatchInfo(): Promise<void> {
  const db = await getAdminDb();
  await db.ref("drive/meta/watch").remove();
}

export async function getLastNotification(): Promise<string | null> {
  const db = await getAdminDb();
  const snap = await db.ref("drive/meta/lastNotification").once("value");
  const val = snap.val();
  if (!val || typeof val !== "object") return null;
  const at = val.at;
  return typeof at === "string" ? at : null;
}

export async function setLastNotification(
  notification: LastNotification,
): Promise<void> {
  const db = await getAdminDb();
  await db.ref("drive/meta/lastNotification").set(notification);
}

export async function clearDriveMeta(): Promise<void> {
  const db = await getAdminDb();
  await Promise.all([
    db.ref("drive/meta/pageToken").remove(),
    db.ref("drive/meta/watch").remove(),
    db.ref("drive/meta/lastNotification").remove(),
  ]);
  console.log("[DriveMeta] Cleared drive/meta/*");
}