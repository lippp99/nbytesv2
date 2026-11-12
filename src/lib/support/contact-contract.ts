// Admin contact shown to users (owner, 2026-11-12): WhatsApp, Telegram and email, each with its own show switch.
// Shared by the admin form, the API route and the user page. Values are stored normalized.
import { EMAIL_MAX_LENGTH, isValidEmail, normalizeEmail } from "../auth/auth-contract.ts";

export const CONTACT_CHANNELS = ["whatsapp", "telegram", "email"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];
export type ContactEntry = { value: string; visible: boolean };
export type ContactSettings = Record<ContactChannel, ContactEntry>;
/** What the user page gets: only switched-on channels, value plus the link that opens it. */
export type VisibleContact = { channel: ContactChannel; value: string; href: string };

export const EMPTY_CONTACTS: ContactSettings = {
  whatsapp: { value: "", visible: false }, telegram: { value: "", visible: false }, email: { value: "", visible: false },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * One value -> its stored form, or null when invalid. WhatsApp: international number, digits only (spaces, dashes and a
 * leading + are dropped), 8–15 digits (E.164 maximum), not starting with 0. Telegram: a username, 5–32 letters, digits
 * or _ (a leading @ or t.me/ is dropped). Email: same rule as sign-in.
 */
export function normalizeContact(channel: ContactChannel, raw: string): string | null {
  const text = raw.trim();
  if (channel === "whatsapp") {
    const digits = text.replace(/^\+/, "").replace(/[\s-]/g, "");
    return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
  }
  if (channel === "telegram") {
    const name = text.replace(/^(https?:\/\/)?t\.me\//i, "").replace(/^@/, "");
    return /^[A-Za-z0-9_]{5,32}$/.test(name) ? name : null;
  }
  const email = normalizeEmail(text);
  return email.length <= EMAIL_MAX_LENGTH && isValidEmail(email) ? email : null;
}

/** The link that opens the channel: WhatsApp click-to-chat, Telegram profile, or the mail app. */
export function contactHref(channel: ContactChannel, value: string): string {
  if (channel === "whatsapp") return `https://wa.me/${value}`;
  if (channel === "telegram") return `https://t.me/${value}`;
  return `mailto:${value}`;
}

/** Field error per channel: a shown channel needs a valid value; a hidden one may stay empty but not be invalid. */
export function contactErrors(input: ContactSettings): Partial<Record<ContactChannel, "required" | "invalid">> {
  const errors: Partial<Record<ContactChannel, "required" | "invalid">> = {};
  for (const channel of CONTACT_CHANNELS) {
    const { value, visible } = input[channel];
    if (!value.trim()) {
      if (visible) errors[channel] = "required";
    } else if (normalizeContact(channel, value) === null) errors[channel] = "invalid";
  }
  return errors;
}

/** Body of POST /api/admin/contact: all three channels, each { value: string, visible: boolean }, values valid. */
export function parseContactBody(json: unknown): ContactSettings | null {
  if (!isRecord(json)) return null;
  const out = { ...EMPTY_CONTACTS };
  for (const channel of CONTACT_CHANNELS) {
    const entry = json[channel];
    if (!isRecord(entry) || typeof entry.value !== "string" || typeof entry.visible !== "boolean") return null;
    if (entry.value.length > 320) return null;
    out[channel] = { value: entry.value, visible: entry.visible };
  }
  if (Object.keys(contactErrors(out)).length > 0) return null;
  for (const channel of CONTACT_CHANNELS) {
    const value = out[channel].value.trim();
    out[channel] = { ...out[channel], value: value ? (normalizeContact(channel, value) as string) : "" };
  }
  return out;
}
