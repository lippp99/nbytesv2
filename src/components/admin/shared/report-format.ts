// Number and date shapes of the admin Usage and Leaderboard pages (counts, basis points, period names). Server only.
import type { UsagePeriod } from "@/lib/admin-gateway/usage-contract";

export const count = (v: number) => v.toLocaleString("en-US");
export const percent = (bp: number) => `${(bp / 100).toFixed(1)}%`;
export const signedPercent = (bp: number) => `${bp > 0 ? "+" : ""}${percent(bp)}`;

const monthFormat = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
/** "2026-11" -> "November 2026". */
export const monthName = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`));

const dayFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortMonthFormat = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" });
/** "2026-11-01" -> "1 Nov 2026". */
const dayName = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));
/** Chart label of a month bucket: "2026-11" -> "Nov 2026". */
export const shortMonthName = (month: string) => shortMonthFormat.format(new Date(`${month}-01T00:00:00Z`));

/** A period in words: "November 2026", "2026", or "1 Nov 2026 – 13 Nov 2026". */
export function periodName(p: UsagePeriod): string {
  if (p.kind === "month") return monthName(p.month);
  if (p.kind === "year") return p.year;
  return p.from === p.to ? dayName(p.from) : `${dayName(p.from)} – ${dayName(p.to)}`;
}
