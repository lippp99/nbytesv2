// Admin call to suspend or restore a user (POST /api/admin/users/{id}/status). Components use this, never raw fetch.
import type { UserStatusBody } from "./user-admin-contract";

export type UserStatusError = "offline" | "unauthorized" | "invalid_input" | "not_found" | "unavailable";
export type UserStatusResult = { ok: true } | { ok: false; error: UserStatusError };

const KNOWN: UserStatusError[] = ["unauthorized", "invalid_input", "not_found"];

export async function setUserStatus(userId: string, body: UserStatusBody): Promise<UserStatusResult> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return { ok: true };
  const code = data?.error?.code;
  return { ok: false, error: KNOWN.includes(code) ? code : "unavailable" };
}
