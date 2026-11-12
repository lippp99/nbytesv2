import type { AuthErrorCode } from "@/lib/auth/auth-contract";

// Calls to the admin auth API (PRD backend-auth-admin §12). Components use these, never raw fetch.

export type AdminError =
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "rate_limited"; retryAfterMinutes: number }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "expired" }
  | { kind: "invalid_input" }
  | { kind: "unauthorized" };

export type AdminResult<T> = ({ ok: true } & T) | { ok: false; error: AdminError };

type ErrorBody = { code?: AuthErrorCode; retryAfterMinutes?: number; attemptsLeft?: number };

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

function toAdminError(error: ErrorBody | undefined): AdminError {
  switch (error?.code) {
    case "rate_limited":
      return { kind: "rate_limited", retryAfterMinutes: Math.max(1, error.retryAfterMinutes ?? 1) };
    case "invalid":
      return { kind: "invalid", attemptsLeft: error.attemptsLeft ?? 0 };
    case "expired":
    case "invalid_input":
    case "unauthorized":
      return { kind: error.code };
    default:
      return { kind: "unavailable" };
  }
}

async function post<T>(path: string, body: object = {}): Promise<AdminResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, error: { kind: isOffline() ? "offline" : "unavailable" } };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return data as { ok: true } & T;
  return { ok: false, error: toAdminError(data?.error) };
}

/** Step 1: same answer for every valid email, so it never tells who is an admin. */
export const requestAdminCode = (email: string) => post<{ resendAfter: number }>("/api/admin/auth/code/request", { email });

/** Step 2: the 10-digit email code; says whether step 3 is the authenticator or its first setup. */
export const verifyAdminCode = (email: string, code: string) =>
  post<{ next: "totp" | "enroll" }>("/api/admin/auth/code/verify", { email, code });

/** Step 3, first login: a new secret to add to the authenticator app. */
export const startTotpEnrollment = () => post<{ secret: string; otpauthUrl: string }>("/api/admin/auth/totp/enroll");

/** Step 3: authenticator or backup code. After a first setup the 10 backup codes come back, once. */
export const verifySecondFactor = (code: string) => post<{ backupCodes?: string[] }>("/api/admin/auth/totp/verify", { code });
