// Admin settings calls (POST /api/admin/...). One shape for all of them: { ok } or a short error code.
// Used by finance (exchange rate, deposit rules), contact and platform settings. Components never call raw fetch.
import type { PlatformSettings } from "./platform-settings-contract";

export type AdminPostError = "offline" | "unauthorized" | "invalid_input" | "unavailable";
export type AdminPostResult = { ok: true } | { ok: false; error: AdminPostError };

export async function postAdmin(url: string, body: unknown): Promise<AdminPostResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, error: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return { ok: true };
  const code = data?.error?.code;
  return { ok: false, error: code === "unauthorized" || code === "invalid_input" ? code : "unavailable" };
}

export const savePlatformSettings = (settings: PlatformSettings) => postAdmin("/api/admin/settings", settings);
