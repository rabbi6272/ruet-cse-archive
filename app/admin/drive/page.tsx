"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "driveAdminSecret";

type AdminAction = "setup" | "revalidate" | "delete" | "renew" | "status";

interface AdminStatus {
  cache?: {
    tag?: string;
    revalidateFallbackSeconds?: number;
    invalidation?: string;
  } | null;
  watch?: {
    channelId?: string | null;
    resourceId?: string | null;
    expiration?: string | null;
    expired?: boolean;
  } | null;
  pageToken?: "present" | "missing";
  lastNotification?: string | null;
}

interface AdminResponse {
  ok: boolean;
  action?: AdminAction;
  details?: Record<string, unknown>;
  status?: AdminStatus;
}

export default function DriveAdminPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<AdminAction | null>(null);
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({
    type: "",
    text: "",
  });
  const [warm, setWarm] = useState(true);
  const [clearMeta, setClearMeta] = useState(false);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
  }, []);

  const api = useCallback(
    async <T = AdminResponse>(method: string, body?: Record<string, unknown>) => {
      const res = await fetch("/api/drive/admin", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    [token],
  );

  const authorize = async (secret: string) => {
    setLoading(true);
    setTokenInput("");
    try {
      const res = await fetch("/api/drive/admin", {
        method: "GET",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
      }
      sessionStorage.setItem(TOKEN_KEY, secret);
      setToken(secret);
      setStatus(data as AdminStatus);
      setLoading(false);
    } catch {
      setLoading(false);
      showMessage("error", "Incorrect admin secret. Access denied.");
    }
  };

  const lockOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setStatus(null);
    setLoading(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    api<AdminStatus>("GET")
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: AdminAction) => {
    setBusy(action);
    setMessage({ type: "", text: "" });
    try {
      const body: Record<string, unknown> = { action };
      if (action === "revalidate") body.warm = warm;
      if (action === "delete") body.clearMeta = clearMeta;
      const data = await api("POST", body);
      setStatus(data.status ?? null);
      showMessage("success", detailsSummary(data));
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  };

  const handleAction = (action: AdminAction) => {
    if (action === "delete") {
      const ok = confirm(
        clearMeta
          ? "This invalidates ALL drive caches and permanently clears the watch/page-token metadata. Continue?"
          : "This invalidates ALL drive caches. Continue?",
      );
      if (!ok) return;
    }
    runAction(action);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-blue-500 dark:text-blue-400 text-6xl mb-4">
              💾
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Drive Cache Admin
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the admin secret (ADMIN_SECRET) to manage the Google Drive
              cache system.
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
                }`}
            >
              {message.text}
            </div>
          )}

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (tokenInput.trim()) authorize(tokenInput.trim());
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="secret"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Admin Secret
              </label>
              <input
                type="password"
                id="secret"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ADMIN_SECRET"
                required
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Access
              </button>
            </div>
          </form>

          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>
              The secret is sent to /api/drive/admin as a Bearer token and kept
              in sessionStorage for this tab only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const watch = status?.watch;
  const lastNotif = status?.lastNotification
    ? new Date(status.lastNotification).toLocaleString()
    : "never";

  return (
    <div className="min-h-screen">
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                Drive Cache Admin
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage webhook watch, cache invalidation and Drive metadata
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status:{" "}
                {watch ? (
                  watch.expired ? (
                    <span className="text-red-600 font-medium">Watch expired</span>
                  ) : (
                    <span className="text-green-600 font-medium">Watch active</span>
                  )
                ) : (
                  <span className="text-amber-600 font-medium">No watch</span>
                )}
              </p>
              <button
                onClick={lockOut}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Lock
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {message.text && (
          <div
            className={`flex justify-between items-center border rounded-md px-4 py-1 text-sm ${message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
              }`}
          >
            {message.text}
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-2xl text-inherit opacity-70 hover:opacity-100 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Cache
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Tag</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-mono">
                  {status?.cache?.tag ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Fallback TTL</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {(status?.cache?.revalidateFallbackSeconds ?? 0) / 3600} h
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">
                  Invalidation
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 text-xs">
                  {status?.cache?.invalidation ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Watch Channel
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Channel ID</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-mono text-xs break-all text-right">
                  {watch?.channelId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Expiration</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {watch?.expiration
                    ? new Date(watch.expiration).toLocaleString()
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Page token</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {status?.pageToken === "present" ? (
                    <span className="text-green-600">present</span>
                  ) : (
                    <span className="text-red-600">missing</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">
                  Last webhook
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">{lastNotif}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => handleAction("setup")}
                disabled={busy !== null}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {busy === "setup" ? "Setting up..." : "Setup watch & page token"}
              </button>
              <button
                onClick={() => handleAction("revalidate")}
                disabled={busy !== null}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {busy === "revalidate" ? "Invalidating..." : "Revalidate cache"}
              </button>
              <button
                onClick={() => handleAction("renew")}
                disabled={busy !== null}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                {busy === "renew" ? "Renewing..." : "Renew watch"}
              </button>
              <button
                onClick={() => handleAction("delete")}
                disabled={busy !== null}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {busy === "delete" ? "Deleting..." : "Delete cache"}
              </button>

              <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
                <span>Re-warm root folder</span>
                <input
                  type="checkbox"
                  checked={warm}
                  onChange={(e) => setWarm(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Clear metadata too</span>
                <input
                  type="checkbox"
                  checked={clearMeta}
                  onChange={(e) => setClearMeta(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => runAction("status")}
            disabled={busy !== null}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {busy === "status" ? "Refreshing..." : "Refresh status"}
          </button>
        </div>
      </div>
    </div>
  );
}

function detailsSummary(data: AdminResponse): string {
  const d = data.details || {};
  const bits: string[] = [];
  if (d.pageToken) bits.push(`pageToken: ${d.pageToken}`);
  if (d.watch) {
    const watch = d.watch as { created?: boolean; renewed?: boolean };
    bits.push(
      watch.created !== undefined
        ? `watch ${watch.created ? "created" : "exists"}`
        : "watch ok",
    );
    if (watch.renewed !== undefined)
      bits.push(watch.renewed ? "renewed" : "watch unchanged");
  }
  if (d.warmedFolder) bits.push(`root re-warmed`);
  if (d.invalidated) bits.push("invalidated");
  if (d.metaCleared) bits.push("metadata cleared");
  return `${data.action ?? ""} done — ${bits.join(", ") || "ok"}`;
}