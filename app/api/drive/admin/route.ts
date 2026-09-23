import { NextResponse } from "next/server";
import {
  initializePageToken,
  createWatchChannel,
  renewWatchIfNeeded,
  type WatchState,
} from "@/lib/drive-changes";
import {
  getWatchInfo,
  getPageToken,
  getLastNotification,
  clearDriveMeta,
  type WatchInfo,
} from "@/lib/drive-meta";
import {
  invalidateAllDriveCaches,
  getCachedDriveData,
  DRIVE_CACHE_TAG,
  DRIVE_CACHE_REVALIDATE_SECONDS,
} from "@/lib/drive-cache";
import { fetchDriveData } from "@/lib/drive-data";
import { getRootFolderId } from "@/lib/drive-config";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const WEBHOOK_URL = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
const WEBHOOK_TOKEN = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;

const VALID_ACTIONS = ["setup", "revalidate", "delete", "renew", "status"] as const;
type AdminAction = (typeof VALID_ACTIONS)[number];

interface AdminStatus {
  cache: {
    tag: string;
    revalidateFallbackSeconds: number;
    invalidation: string;
  };
  watch: {
    channelId: string;
    resourceId: string | null;
    expiration: string | null;
    expired: boolean;
  } | null;
  pageToken: "present" | "missing";
  lastNotification: string | null;
}

function verifyAdmin(req: Request): boolean {
  if (!ADMIN_SECRET) return false;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${ADMIN_SECRET}`;
}

async function buildStatus(): Promise<AdminStatus> {
  const [watchInfo, pageToken, lastNotification] = await Promise.all([
    getWatchInfo(),
    getPageToken(),
    getLastNotification(),
  ]);

  return {
    cache: {
      tag: DRIVE_CACHE_TAG,
      revalidateFallbackSeconds: DRIVE_CACHE_REVALIDATE_SECONDS,
      invalidation: "webhook (revalidateTag) + time fallback",
    },
    watch: watchInfo
      ? {
        channelId: watchInfo.channelId,
        resourceId: watchInfo.resourceId || null,
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
  };
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!verifyAdmin(req)) return unauthorized();
  try {
    return NextResponse.json(await buildStatus());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function ensureWatchEnv() {
  if (!WEBHOOK_URL || !WEBHOOK_TOKEN) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  if (!verifyAdmin(req)) return unauthorized();

  let action: AdminAction;
  let opts: { warm?: boolean; clearMeta?: boolean } = {};
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new Error("Invalid body");
    const candidate = String((body as { action?: unknown }).action ?? "");
    if (!VALID_ACTIONS.includes(candidate as AdminAction)) {
      return NextResponse.json(
        {
          ok: false,
          error: `action must be one of: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }
    action = candidate as AdminAction;
    opts = {
      warm: Boolean((body as { warm?: unknown }).warm),
      clearMeta: Boolean((body as { clearMeta?: unknown }).clearMeta),
    };
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body. Expected JSON with action field.",
      },
      { status: 400 },
    );
  }

  try {
    const details: Record<string, unknown> = {};

    if (action === "setup") {
      if (!ensureWatchEnv()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "GOOGLE_DRIVE_WEBHOOK_URL and GOOGLE_DRIVE_WEBHOOK_TOKEN must be set to create the watch channel",
          },
          { status: 500 },
        );
      }

      const pageToken = await initializePageToken();
      details.pageToken = pageToken ? "present" : "missing";

      let watchInfo: WatchInfo | null = await getWatchInfo();
      let watchCreated = false;
      if (
        !watchInfo ||
        !watchInfo.expiration ||
        Date.now() > Number(watchInfo.expiration)
      ) {
        watchInfo = await createWatchChannel(WEBHOOK_URL!, WEBHOOK_TOKEN!);
        watchCreated = true;
      }
      details.watch = {
        channelId: watchInfo.channelId,
        resourceId: watchInfo.resourceId || null,
        expiration: new Date(Number(watchInfo.expiration)).toISOString(),
        created: watchCreated,
      };
    }

    if (action === "revalidate" || action === "delete") {
      const invalidated = await invalidateAllDriveCaches();

      if (action === "revalidate" && opts.warm) {
        await getCachedDriveData(getRootFolderId(), () =>
          fetchDriveData(getRootFolderId()),
        );
        details.warmedFolder = getRootFolderId();
      }

      if (action === "delete" && opts.clearMeta) {
        await clearDriveMeta();
        details.metaCleared = true;
      }

      details.invalidated = invalidated;
    }

    if (action === "renew") {
      if (!ensureWatchEnv()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "GOOGLE_DRIVE_WEBHOOK_URL and GOOGLE_DRIVE_WEBHOOK_TOKEN must be set to renew the watch channel",
          },
          { status: 500 },
        );
      }

      const result: WatchState = await renewWatchIfNeeded(
        WEBHOOK_URL!,
        WEBHOOK_TOKEN!,
      );
      details.renewed = result.renewed !== false;
      details.watch = {
        channelId: result.channelId,
        resourceId: result.resourceId || null,
        expiration: result.expiration
          ? new Date(Number(result.expiration)).toISOString()
          : null,
      };
    }

    return NextResponse.json({
      ok: true,
      action,
      details,
      status: await buildStatus(),
    });
  } catch (err) {
    console.error(`[DriveAdmin] ${action} failed:`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}