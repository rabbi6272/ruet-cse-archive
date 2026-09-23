import { NextResponse } from "next/server";
import { processChanges } from "@/lib/drive-changes";
import { getWatchInfo, setLastNotification } from "@/lib/drive-meta";
import { invalidateAllDriveCaches } from "@/lib/drive-cache";

const EXPECTED_TOKEN = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;

export async function POST(req: Request) {
  const headers = {
    "x-goog-channel-id": req.headers.get("x-goog-channel-id"),
    "x-goog-channel-token": req.headers.get("x-goog-channel-token"),
    "x-goog-resource-id": req.headers.get("x-goog-resource-id"),
    "x-goog-resource-state": req.headers.get("x-goog-resource-state"),
    "x-goog-message-number": req.headers.get("x-goog-message-number"),
  };

  if (EXPECTED_TOKEN && headers["x-goog-channel-token"] !== EXPECTED_TOKEN) {
    console.warn("[Webhook] Invalid token, ignoring");
    return new NextResponse(null, { status: 403 });
  }

  const watchInfo = await getWatchInfo();
  if (watchInfo) {
    if (
      watchInfo.channelId &&
      headers["x-goog-channel-id"] !== watchInfo.channelId
    ) {
      console.warn("[Webhook] Unknown channel, ignoring");
      return new NextResponse(null, { status: 200 });
    }
    if (
      watchInfo.resourceId &&
      headers["x-goog-resource-id"] !== watchInfo.resourceId
    ) {
      console.warn("[Webhook] Resource ID mismatch, ignoring");
      return new NextResponse(null, { status: 200 });
    }
  }

  const resourceState = headers["x-goog-resource-state"];
  const messageNumber = headers["x-goog-message-number"];

  console.log(
    `[Webhook] Received: state=${resourceState}, message=${messageNumber}, channel=${headers["x-goog-channel-id"]}`,
  );

  if (resourceState === "sync") {
    console.log("[Webhook] Sync notification, acknowledging");
    await recordNotification(
      resourceState,
      messageNumber,
      headers["x-goog-channel-id"],
    );
    return new NextResponse(null, { status: 200 });
  }

  await recordNotification(
    resourceState,
    messageNumber,
    headers["x-goog-channel-id"],
  );

  try {
    const { changes } = await processChanges();

    if (changes.length === 0) {
      console.log("[Webhook] No changes detected");
    } else {
      console.log(
        `[Webhook] ${changes.length} change(s) detected — invalidating cache`,
      );
      await invalidateAllDriveCaches();
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error(
      "[Webhook] Processing failed:",
      err instanceof Error ? err.message : err,
    );
    return new NextResponse(null, { status: 500 });
  }
}

async function recordNotification(
  state: string | null,
  messageNumber: string | null,
  channelId: string | null,
) {
  try {
    await setLastNotification({
      at: new Date().toISOString(),
      state: state || null,
      messageNumber: messageNumber || null,
      channelId: channelId || null,
    });
  } catch (err) {
    console.error(
      "[Webhook] Failed to record notification marker:",
      err instanceof Error ? err.message : err,
    );
  }
}

