import "server-only";
import type { AuthMode } from "@/lib/auth/auth-contract";

// Pure decisions of the email-code flow (PRD backend-auth-user §4.2, §4.3, §5, §7.1), kept apart from the DB for tests.

export const OTP_PURPOSE = "user-login";
export const DELETE_PURPOSE = "account-delete"; // PRD account-settings §12
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5; // = OTP_MAX_ATTEMPTS in auth-contract
export const OTP_RESEND_SECONDS = 60;
export const TERMS_VERSION = "2026-11-09"; // owner decision §16.10 still open

export const LIMITS = {
  sendPerIp: { limit: 20, windowSeconds: 3600 },
  sendCooldownPerEmail: { limit: 1, windowSeconds: OTP_RESEND_SECONDS },
  sendPerEmail: { limit: 5, windowSeconds: 3600 },
  verifyPerIp: { limit: 30, windowSeconds: 3600 },
  deleteSendPerUser: { limit: 5, windowSeconds: 3600 },
} as const;

export type UserStatus = "active" | "suspended";
export type EmailKind = "signup" | "login" | "signup_closed" | "suspended" | "no_account" | "delete_account";

/**
 * Which email step 1 sends. The HTTP response is the same for all, so neither tab reveals whether an email has an
 * account. Register with a known email gets a login code; login with an unknown email gets no code.
 */
export function decideEmail(status: UserStatus | undefined, signupOpen: boolean, mode: AuthMode): EmailKind {
  if (status === "suspended") return "suspended";
  if (status === "active") return "login";
  if (mode === "login") return "no_account";
  return signupOpen ? "signup" : "signup_closed";
}

export const emailGetsCode = (kind: EmailKind) => kind === "signup" || kind === "login";

export type Challenge = { attempts: number; expiresAt: Date; consumedAt: Date | null };
export type AttemptResult = { kind: "ok" } | { kind: "invalid"; attemptsLeft: number } | { kind: "expired" };

/**
 * One verify attempt. `expired` = the code was already unusable (nothing to count). A wrong code is always `invalid`
 * so the caller stores the attempt; `attemptsLeft: 0` is then answered as expired.
 */
export function judgeAttempt(challenge: Challenge | undefined, codeMatches: boolean, now: Date): AttemptResult {
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= now || challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { kind: "expired" };
  }
  if (codeMatches) return { kind: "ok" };
  return { kind: "invalid", attemptsLeft: OTP_MAX_ATTEMPTS - (challenge.attempts + 1) };
}

export type LoginDecision = "login" | "create" | "blocked_suspended" | "blocked_signup_closed" | "blocked_no_account";

/**
 * After a correct code: sign in, create the account, or refuse (shown to the client as a generic `expired`).
 * Only the register tab creates accounts, since only it carries the names.
 */
export function decideLogin(status: UserStatus | undefined, signupOpen: boolean, mode: AuthMode): LoginDecision {
  if (status === "suspended") return "blocked_suspended";
  if (status === "active") return "login";
  if (mode === "login") return "blocked_no_account";
  return signupOpen ? "create" : "blocked_signup_closed";
}
