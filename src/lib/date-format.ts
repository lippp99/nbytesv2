const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB is UTC+7 all year (no daylight saving)

/** "2026-11-10T07:20:00Z" -> "10 Nov, 14.20 WIB" ("10 Nov 2026, …" withYear); no Intl, same on server and client. */
export function formatWib(iso: string, withYear = false): string {
  const d = new Date(Date.parse(iso) + WIB_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
  return `${day}, ${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())} WIB`;
}

/** Seconds left of a wait: 60 -> "1:00", 59 -> "0:59" (login, admin login, account deletion). */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "2026-11-08T09:14:22Z" -> "2026-11-08 09:14" (UTC, as stored); a bare date passes through. */
export function formatUtc(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}
