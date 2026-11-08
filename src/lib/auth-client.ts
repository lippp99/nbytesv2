import { OTP_MAX_ATTEMPTS, normalizeEmail } from "@/lib/auth-contract";

// shortcut: mock tanpa server, ganti dengan fetch ke API saat backend dibuat
export type AuthError =
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "rate_limited"; retryAfterMinutes: number }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "expired" };

export type AuthResult<T> = ({ ok: true } & T) | { ok: false; error: AuthError };

const MOCK_DELAY_MS = 600;
const MOCK_VALID_CODE = "12345678";
const MOCK_EXPIRED_CODE = "00000000";
const attemptsLeftByEmail = new Map<string, number>();

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

/** Mock rules: `@limit.test` -> rate limited, `@down.test` -> provider down, anything else -> sent. */
export async function requestOtp(rawEmail: string): Promise<AuthResult<{ resendAfter: number }>> {
  if (isOffline()) return { ok: false, error: { kind: "offline" } };
  await wait();
  const email = normalizeEmail(rawEmail);
  if (email.endsWith("@limit.test")) return { ok: false, error: { kind: "rate_limited", retryAfterMinutes: 15 } };
  if (email.endsWith("@down.test")) return { ok: false, error: { kind: "unavailable" } };
  attemptsLeftByEmail.set(email, OTP_MAX_ATTEMPTS);
  return { ok: true, resendAfter: 60 };
}

/** Mock rules: 12345678 -> success, 00000000 -> expired, other codes burn one of 5 attempts. */
export async function verifyOtp(rawEmail: string, code: string): Promise<AuthResult<object>> {
  if (isOffline()) return { ok: false, error: { kind: "offline" } };
  await wait();
  const email = normalizeEmail(rawEmail);
  const left = attemptsLeftByEmail.get(email) ?? 0;
  if (code === MOCK_EXPIRED_CODE || left <= 0) return { ok: false, error: { kind: "expired" } };
  if (code === MOCK_VALID_CODE) {
    attemptsLeftByEmail.delete(email);
    return { ok: true };
  }
  attemptsLeftByEmail.set(email, left - 1);
  if (left - 1 <= 0) return { ok: false, error: { kind: "expired" } };
  return { ok: false, error: { kind: "invalid", attemptsLeft: left - 1 } };
}

export const DEMO_CODE_HINT = MOCK_VALID_CODE;
