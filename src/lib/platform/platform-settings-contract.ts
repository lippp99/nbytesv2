// Platform settings set on the admin Settings page (PRD backend-auth-admin A.7; owner decisions 2026-11-12).
// Shared by the admin form, the API route and every server part that obeys them.

export const ADMIN_SESSION_HOURS = [4, 8, 12] as const;
export type AdminSessionHours = (typeof ADMIN_SESSION_HOURS)[number];

export type PlatformSettings = {
  /** New accounts may sign up; existing accounts can always sign in. */
  signupOpen: boolean;
  /** On: /api/v1 and the Playground answer 503; the dashboard stays open and shows `banner`. */
  maintenance: boolean;
  banner: string;
  /** Requests per minute for every API key, existing ones included, from the next request on. */
  keyRpm: number;
  /** Length of an admin session from the next admin login; the 30-minute idle sign-out stays. */
  adminSessionHours: AdminSessionHours;
};

/** In force until an admin saves the page: the values the code used before the page existed. */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  signupOpen: true, maintenance: false, banner: "", keyRpm: 120, adminSessionHours: 8,
};

export const BANNER_MAX = 140;
export const KEY_RPM_BOUNDS = { min: 1, max: 10_000 } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export type SettingsFieldError = "bannerRequired" | "bannerTooLong" | "rpmInvalid";

/** Field errors of a would-be save; the maintenance banner is required while maintenance is on. */
export function settingsErrors(s: PlatformSettings): Partial<Record<"banner" | "keyRpm", SettingsFieldError>> {
  const banner = s.banner.trim();
  const errors: Partial<Record<"banner" | "keyRpm", SettingsFieldError>> = {};
  if (s.maintenance && !banner) errors.banner = "bannerRequired";
  else if (banner.length > BANNER_MAX) errors.banner = "bannerTooLong";
  if (!Number.isSafeInteger(s.keyRpm) || s.keyRpm < KEY_RPM_BOUNDS.min || s.keyRpm > KEY_RPM_BOUNDS.max) {
    errors.keyRpm = "rpmInvalid";
  }
  return errors;
}

/** Body of POST /api/admin/settings: every field, right types, no field error. The banner is stored trimmed. */
export function parseSettingsBody(json: unknown): PlatformSettings | null {
  if (!isRecord(json)) return null;
  const { signupOpen, maintenance, banner, keyRpm, adminSessionHours } = json;
  if (typeof signupOpen !== "boolean" || typeof maintenance !== "boolean" || typeof banner !== "string") return null;
  if (typeof keyRpm !== "number" || !ADMIN_SESSION_HOURS.includes(adminSessionHours as AdminSessionHours)) return null;
  const settings: PlatformSettings = {
    signupOpen, maintenance, banner: banner.trim(), keyRpm, adminSessionHours: adminSessionHours as AdminSessionHours,
  };
  return Object.keys(settingsErrors(settings)).length ? null : settings;
}
