import type { AuthAccount, AuthErrorCode, AuthMode, Profile } from "@/lib/auth/auth-contract";

export type AuthError =
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "rate_limited"; retryAfterMinutes: number }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "expired" };

export type AuthResult<T, E = AuthError> = ({ ok: true } & T) | { ok: false; error: E };
/** The user auth API can also answer these (the admin login, which shares AuthError, cannot yet). */
export type UserAuthError = AuthError | { kind: "invalid_input" } | { kind: "unauthorized" };

type ErrorBody = { code?: AuthErrorCode; retryAfterMinutes?: number; attemptsLeft?: number };

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

/** Server error body (PRD backend-auth-user §8) -> the error kinds the login UI already shows. */
function toAuthError(error: ErrorBody | undefined): UserAuthError {
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

async function post<T>(path: string, body: object): Promise<AuthResult<T, UserAuthError>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { kind: isOffline() ? "offline" : "unavailable" } };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return data as { ok: true } & T;
  return { ok: false, error: toAuthError(data?.error) };
}

export function requestOtp(mode: AuthMode, email: string): Promise<AuthResult<{ resendAfter: number }, UserAuthError>> {
  return post("/api/auth/otp/request", { mode, email });
}

export function verifyOtp(
  account: AuthAccount,
  email: string,
  code: string,
  next: string | null,
): Promise<AuthResult<{ redirect: string }, UserAuthError>> {
  return post("/api/auth/otp/verify", { ...account, email, code, next });
}

/** Signs out one other device (PRD active-sessions §5.1). */
export function revokeSession(sessionId: string): Promise<AuthResult<object, UserAuthError>> {
  return post("/api/auth/sessions/revoke", { sessionId });
}

/** Saves the signed-in user's name from Account Settings (PRD account-settings §4.1). */
export function updateProfile(profile: Profile): Promise<AuthResult<{ profile: Profile }, UserAuthError>> {
  return post("/api/account/profile", profile);
}

/** Step 1 of account deletion: emails a code to the account's own address (PRD account-settings §12). */
export function requestDeleteCode(confirm: string): Promise<AuthResult<{ resendAfter: number }, UserAuthError>> {
  return post("/api/account/delete/request", { confirm });
}

/** Step 2: deletes the account; the server clears the session cookie. */
export function deleteAccount(confirm: string, code: string): Promise<AuthResult<object, UserAuthError>> {
  return post("/api/account/delete", { confirm, code });
}

/** Signs out every other device; resolves with how many went (PRD active-sessions §5.2). */
export function revokeOtherSessions(): Promise<AuthResult<{ revoked: number }, UserAuthError>> {
  return post("/api/auth/sessions/revoke-others", {});
}
