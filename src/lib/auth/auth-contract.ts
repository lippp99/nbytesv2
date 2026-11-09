// Validation shared by the login form now and the OTP API later (PRD §6.2).
export const OTP_LENGTH = 8;
export const EMAIL_MAX_LENGTH = 254;
export const OTP_MAX_ATTEMPTS = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

// Letters (any script) with spaces, apostrophes, hyphens and dots inside: "Siti", "O'Brien", "Jean-Luc".
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}'’ .-]*$/u;
export const NAME_MAX_LENGTH = 50;

/** Trims and collapses inner whitespace: "  Siti   Aisyah " -> "Siti Aisyah". */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidName(value: string): boolean {
  const name = normalizeName(value);
  return name.length <= NAME_MAX_LENGTH && NAME_PATTERN.test(name);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}

/** Drops every non-digit (spaces, dashes from "1234-5678") and caps at 8 digits. */
export function sanitizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function isValidOtp(value: string): boolean {
  return OTP_PATTERN.test(value);
}

/** "andi@domain.com" -> "a***@domain.com" */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}

// --- API contract (PRD backend-auth-user §8): parsed once here, used by the route handlers and the client.

export type AuthErrorCode = "invalid_input" | "rate_limited" | "invalid" | "expired" | "unavailable" | "unauthorized";
/** The user's own name (register tab, Account Settings). Last name is optional. */
export type Profile = { firstName: string; lastName: string | null };
// Login and register are separate tabs; both prove the email with a code. Register also sends the names, which are
// stored only when the code creates the account.
export type AuthMode = "login" | "register";
export type AuthAccount = { mode: "login" } | ({ mode: "register" } & Profile);
export type OtpRequestBody = { mode: AuthMode; email: string };
export type OtpVerifyBody = AuthAccount & { email: string; code: string; next: string | null };

export const DEFAULT_AFTER_LOGIN = "/quick-start";
/** Request header the proxy sets to the dashboard path being opened, so the server can send `?next=` to /login. */
export const NEXT_PATH_HEADER = "x-nb-path";
// Same pages as the dashboard nav and the proxy matcher (which must stay a literal list).
export const DASHBOARD_PATHS = [
  "/quick-start", "/playground", "/docs", "/usage", "/api-keys", "/models", "/billing", "/settings", "/sessions",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Session cookie: `__Host-` forces Secure + Path=/ + no Domain; plain name only for the http dev server. */
export function sessionCookieName(): string {
  return process.env.NODE_ENV === "development" ? "nb_session" : "__Host-nb_session";
}

const isMode = (value: unknown): value is AuthMode => value === "login" || value === "register";
const validName = (value: unknown): value is string => typeof value === "string" && isValidName(value);
/** Last name is optional: missing, null or blank -> null; otherwise it must be a valid name. */
const optionalName = (value: unknown): string | null | undefined =>
  value === undefined || value === null || (typeof value === "string" && !value.trim())
    ? null
    : validName(value) ? normalizeName(value) : undefined;

/** ?mode=register opens the register tab; anything else opens login. */
export const parseModeParam = (value: unknown): AuthMode => (value === "register" ? "register" : "login");

export function parseOtpRequestBody(json: unknown): OtpRequestBody | null {
  if (!isRecord(json) || !isMode(json.mode) || typeof json.email !== "string" || !isValidEmail(json.email)) return null;
  return { mode: json.mode, email: normalizeEmail(json.email) };
}

/** firstName + optional lastName, normalized; null if either is invalid. Other fields are ignored. */
function parseProfile(json: Record<string, unknown>): Profile | null {
  const lastName = optionalName(json.lastName);
  if (!validName(json.firstName) || lastName === undefined) return null;
  return { firstName: normalizeName(json.firstName), lastName };
}

function parseAccount(json: Record<string, unknown>): AuthAccount | null {
  if (json.mode === "login") return { mode: "login" };
  const profile = json.mode === "register" ? parseProfile(json) : null;
  return profile && { mode: "register", ...profile };
}

/** Body of POST /api/account/profile (Account Settings). Only the two name fields are read (no mass assignment). */
export function parseProfileBody(json: unknown): Profile | null {
  return isRecord(json) ? parseProfile(json) : null;
}

export function parseOtpVerifyBody(json: unknown): OtpVerifyBody | null {
  if (!isRecord(json) || typeof json.email !== "string" || !isValidEmail(json.email)) return null;
  if (typeof json.code !== "string" || !isValidOtp(json.code)) return null;
  if (json.next !== undefined && json.next !== null && typeof json.next !== "string") return null;
  const account = parseAccount(json);
  if (!account) return null;
  return { ...account, email: normalizeEmail(json.email), code: json.code, next: json.next ?? null };
}

// shortcut: path only (letters, digits, "/", "-", "_"); query strings are dropped. Widen if a page needs ?params.
const SAFE_PATH = /^\/[A-Za-z0-9/_-]*$/;

/** A same-site dashboard path to go to after login, or null for anything else (open-redirect guard). */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || !SAFE_PATH.test(value) || value.includes("//")) return null;
  return DASHBOARD_PATHS.some((p) => value === p || value.startsWith(`${p}/`)) ? value : null;
}

// --- Account deletion (PRD account-settings §12): the user types this phrase, then confirms with an email code.

export const DELETE_CONFIRM_PHRASE = "hapus akun";

/** Case and outer spaces do not matter ("Hapus akun" from a phone keyboard counts). */
export const isDeleteConfirmed = (value: unknown): boolean =>
  typeof value === "string" && value.trim().toLowerCase() === DELETE_CONFIRM_PHRASE;

/** Body of POST /api/account/delete/request: only the typed phrase. */
export const parseDeleteRequestBody = (json: unknown): boolean => isRecord(json) && isDeleteConfirmed(json.confirm);

/** Body of POST /api/account/delete: the phrase again and the 8-digit code. */
export function parseDeleteAccountBody(json: unknown): { code: string } | null {
  if (!isRecord(json) || !isDeleteConfirmed(json.confirm)) return null;
  return typeof json.code === "string" && isValidOtp(json.code) ? { code: json.code } : null;
}

// --- Signed-in devices (PRD active-sessions): list DTO, revoke body, pagination.

export const SESSIONS_PAGE_SIZE = 10;

/** One signed-in device as the page sees it: no token, no raw user agent, no user id (PRD active-sessions §5.3). */
export type ActiveSession = {
  id: string;
  device: string;
  /** Country name ("Indonesia") for the flag's accessible label; null when unknown or the session predates it. */
  location: string | null;
  /** 3:2 SVG flag markup from the server (country-flag-icons), null for Tor or unknown. */
  flagSvg: string | null;
  /** Masked IP ("103.47.xx.xx"), null when unknown. */
  ip: string | null;
  signedInAt: string;
  lastSeenAt: string;
  current: boolean;
};
export type ActiveSessionsPage = { sessions: ActiveSession[]; page: number; pages: number; total: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseRevokeBody(json: unknown): { sessionId: string } | null {
  if (!isRecord(json) || typeof json.sessionId !== "string" || !UUID.test(json.sessionId)) return null;
  return { sessionId: json.sessionId.toLowerCase() };
}

/** "?page=3" -> 3; anything else (missing, "abc", "0", "-1", "2.5", array) -> 1. The server clamps the top end. */
export function parsePageParam(value: unknown): number {
  const page = typeof value === "string" && /^\d{1,6}$/.test(value) ? Number(value) : 1;
  return page >= 1 ? page : 1;
}
