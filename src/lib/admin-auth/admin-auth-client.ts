import type { AuthResult } from "@/lib/auth/auth-client";
import { OTP_MAX_ATTEMPTS, normalizeEmail } from "@/lib/auth/auth-contract";

// shortcut: mock tanpa server, ganti dengan fetch ke API admin saat backend dibuat (PRD admin-console §2.4)
const MOCK_DELAY_MS = 600;
const MOCK_EMAIL_CODE = "1234567890";
const MOCK_EXPIRED_CODE = "0000000000";
const MOCK_TOTP = "123456";
let emailAttempts = 0;
let totpAttempts = 0;

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

/** Always "sent" for a valid email, so the response never tells who is an admin. `@limit.test` -> rate limited. */
export async function requestAdminCode(rawEmail: string): Promise<AuthResult<{ resendAfter: number }>> {
  if (isOffline()) return { ok: false, error: { kind: "offline" } };
  await wait();
  if (normalizeEmail(rawEmail).endsWith("@limit.test")) {
    return { ok: false, error: { kind: "rate_limited", retryAfterMinutes: 15 } };
  }
  emailAttempts = OTP_MAX_ATTEMPTS;
  return { ok: true, resendAfter: 60 };
}

/** 1234567890 -> next step, 0000000000 -> expired, other codes burn one of 5 attempts. */
export async function verifyAdminCode(code: string): Promise<AuthResult<object>> {
  if (isOffline()) return { ok: false, error: { kind: "offline" } };
  await wait();
  if (code === MOCK_EXPIRED_CODE || emailAttempts <= 0) return { ok: false, error: { kind: "expired" } };
  if (code === MOCK_EMAIL_CODE) {
    totpAttempts = OTP_MAX_ATTEMPTS;
    return { ok: true };
  }
  emailAttempts -= 1;
  return emailAttempts <= 0
    ? { ok: false, error: { kind: "expired" } }
    : { ok: false, error: { kind: "invalid", attemptsLeft: emailAttempts } };
}

/** 123456 -> signed in; 5 wrong codes -> expired (the form sends the admin back to step 1). */
export async function verifyTotp(code: string): Promise<AuthResult<object>> {
  if (isOffline()) return { ok: false, error: { kind: "offline" } };
  await wait();
  if (code === MOCK_TOTP && totpAttempts > 0) return { ok: true };
  totpAttempts -= 1;
  return totpAttempts <= 0
    ? { ok: false, error: { kind: "expired" } }
    : { ok: false, error: { kind: "invalid", attemptsLeft: totpAttempts } };
}

export const DEMO_ADMIN_CODES = { email: MOCK_EMAIL_CODE, totp: MOCK_TOTP };
