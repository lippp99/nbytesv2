import "server-only";
import { isIP } from "node:net";
import * as flags from "country-flag-icons/string/3x2";

// What the Active Sessions page shows about a client (PRD active-sessions §6.3, §6.6): device, masked IP, country.

/** Stored with each session at login. `ipMasked` is already masked; the full IP is never kept. */
export type ClientInfo = { userAgent: string | null; ipMasked: string | null; country: string | null };

// "Chrome di Windows" from a User-Agent string (PRD active-sessions §6.3). No versions, so the label stays stable.
// The header is client-controlled: the label is a hint for the user, never proof of which device it is.

const UNKNOWN = "Perangkat tidak dikenal";

// Order matters: Edge, Opera and Samsung Internet also carry "Chrome", and Chrome carries "Safari".
const BROWSERS: [RegExp, string][] = [
  [/\bEdg(e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bChrome\/|\bCriOS\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
];

// Order matters: iPhone and iPad UAs say "like Mac OS X", Android says "Linux", ChromeOS is "CrOS".
const SYSTEMS: [RegExp, string][] = [
  [/\biPad\b/, "iPadOS"],
  [/\biPhone\b|\biPod\b/, "iOS"],
  [/\bAndroid\b/, "Android"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bWindows\b/, "Windows"],
  [/\bMacintosh\b|\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

const firstMatch = (ua: string, rules: [RegExp, string][]) => rules.find(([pattern]) => pattern.test(ua))?.[1];

export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return UNKNOWN;
  const browser = firstMatch(userAgent, BROWSERS);
  const system = firstMatch(userAgent, SYSTEMS);
  if (browser && system) return `${browser} di ${system}`;
  return browser ?? system ?? UNKNOWN;
}

/**
 * "103.47.12.9" -> "103.47.xx.xx", "2001:448a:1020::1" -> "2001:448a:…". Only this masked form is ever stored, so
 * the full address never lands in the database. Anything that is not an IP -> null.
 */
export function maskIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]; // IPv4 written as IPv6
  const value = mapped ?? ip;
  const version = isIP(value);
  if (version === 4) return `${value.split(".").slice(0, 2).join(".")}.xx.xx`;
  if (version === 6) {
    const groups = value.toLowerCase().split(":");
    if (!groups[0] || !groups[1]) return null; // "::1" and similar short forms carry no useful prefix
    return `${groups[0]}:${groups[1]}:…`;
  }
  return null;
}

const COUNTRY_CODE = /^[A-Z]{2}$/;
const TOR = "T1"; // Cloudflare's code for the Tor network
const regionNames = new Intl.DisplayNames(["id"], { type: "region" });

/** Accepts Cloudflare's country header value as stored: a two-letter code or T1. "XX" (unknown) and junk -> null. */
export function normalizeCountry(code: string | null | undefined): string | null {
  const value = code?.trim().toUpperCase();
  if (!value || value === "XX") return null;
  return value === TOR || COUNTRY_CODE.test(value) ? value : null;
}

/** "ID" -> "Indonesia", "T1" -> "Jaringan Tor", null -> null. */
export function countryName(code: string | null): string | null {
  if (!code) return null;
  if (code === TOR) return "Jaringan Tor";
  try {
    return regionNames.of(code) ?? null;
  } catch {
    return null; // not a region code Intl knows
  }
}

/**
 * 3:2 SVG flag for a country code, from country-flag-icons (MIT, pinned). SVG, not emoji: Windows renders flag emoji as
 * two letters. Static markup shipped by the package (no scripts), so it is safe to inline. Tor or unknown -> null.
 */
export function countryFlagSvg(code: string | null): string | null {
  if (!code) return null;
  return (flags as Record<string, string | undefined>)[code] ?? null;
}
