const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB is UTC+7 all year (no daylight saving)

/** "2026-11-10T07:20:00Z" -> "10 Nov, 14.20 WIB" ("10 Nov 2026, …" withYear); no Intl, same on server and client. */
export function formatWib(iso: string, withYear = false): string {
  const d = new Date(Date.parse(iso) + WIB_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
  return `${day}, ${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())} WIB`;
}

/** "2026-11-10T20:20:00Z" -> "11 Nov 2026" (the WIB calendar day). */
export function formatWibDate(iso: string): string {
  const d = new Date(Date.parse(iso) + WIB_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Seconds left of a wait: 60 -> "1:00", 59 -> "0:59" (login, admin login, account deletion). */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The same instant shifted so its UTC fields read as the WIB wall clock (for calendar math, never for storing). */
export const wibClock = (date: Date) => new Date(date.getTime() + WIB_OFFSET_MS);

/** The WIB calendar day ("2026-11-13") and month ("2026-11") of an instant. */
export const wibDay = (date: Date) => wibClock(date).toISOString().slice(0, 10);
export const wibMonth = (date: Date) => wibClock(date).toISOString().slice(0, 7);

/** "2026-11-13" -> the instant that day starts in WIB (2026-11-12T17:00:00Z). */
export const wibDayStart = (day: string) => new Date(`${day}T00:00:00+07:00`);

/** The instant the WIB month of `date` starts. */
export const wibMonthStart = (date: Date) => wibDayStart(`${wibMonth(date)}-01`);

/** "2026-11-08T09:14:22Z" -> "2026-11-08 16:14" (admin tables: WIB, sortable shape, no Intl). */
export function formatWibStamp(iso: string): string {
  return wibClock(new Date(iso)).toISOString().slice(0, 16).replace("T", " ");
}
