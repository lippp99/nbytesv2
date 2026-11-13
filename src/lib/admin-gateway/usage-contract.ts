// Admin Usage page: tokens and money per model and per user for one period (a month, a year or a date range, WIB).
// Shared by the server queries, the toolbar and the page, plus the pure rules (period parsing and checks, previous
// period, chart buckets, shares, change) so they can be tested without a database. Days and months are WIB (UTC+7),
// the admin's own clock; the database keeps UTC instants.
import { wibClock, wibDay, wibDayStart, wibMonth } from "../date-format.ts";

export const USAGE_SORTS = ["tokens", "charge", "requests"] as const;
export type UsageSort = (typeof USAGE_SORTS)[number];
export const PERIOD_KINDS = ["month", "year", "range"] as const;
export type PeriodKind = (typeof PERIOD_KINDS)[number];
export const USAGE_USERS_PAGE_SIZE = 25;
export const USAGE_MODELS_PAGE_SIZE = 10;
/** Months and years offered in the pickers, newest first. */
export const USAGE_MONTHS_MAX = 24;
export const USAGE_YEARS_MAX = 10;
/** Longest date range; a longer look uses the year view. */
export const RANGE_MAX_DAYS = 366;
/** Ranges up to this many days chart per day, longer ones per month. */
const DAILY_MAX_DAYS = 62;
const DAY_MS = 86_400_000;
const SEARCH_MAX = 100;
const BP = 10_000;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** month `YYYY-MM`, year `YYYY`, range `YYYY-MM-DD` to `YYYY-MM-DD`, both days included. */
export type UsagePeriod =
  | { kind: "month"; month: string }
  | { kind: "year"; year: string }
  | { kind: "range"; from: string; to: string };
/** page: page of the per-user table; modelPage: page of the per-model table. */
export type UsageQuery = { period: UsagePeriod; sort: UsageSort; search: string | null; page: number; modelPage: number };
/** What the toolbar and search change; both tables go back to page 1 when it changes. */
export type UsageFilters = Omit<UsageQuery, "page" | "modelPage">;
type Paged<T> = { rows: T[]; page: number; pages: number; total: number };
export type RangeProblem = "invalid" | "order" | "future" | "too_long";

export type UsageTotals = {
  requests: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  users: number;
  models: number;
};

/** One bar of the chart: `date` is the day (`YYYY-MM-DD`) or the month (`YYYY-MM`) it covers. */
export type UsageBucket = { date: string; inputTokens: number; outputTokens: number };

/** name: display name from the catalog (Models & pricing); null when the model is no longer in it. */
export type ModelUsage = {
  modelId: string; name: string | null; requests: number; failed: number; inputTokens: number; outputTokens: number; users: number;
  chargeMicros: number; costMicros: number; knownCostChargeMicros: number;
};

/** email null: the account was deleted (its rows stay without an email). */
export type UserUsage = {
  email: string | null; requests: number; inputTokens: number; outputTokens: number; models: number;
  chargeMicros: number; costMicros: number; knownCostChargeMicros: number;
};

export type UsageReport = {
  period: UsagePeriod;
  previous: UsagePeriod;
  months: string[];
  years: string[];
  totals: UsageTotals;
  previousTotals: UsageTotals;
  bucket: "day" | "month";
  buckets: UsageBucket[];
  models: Paged<ModelUsage>;
  users: Paged<UserUsage>;
};

export const dayOf = wibDay;
export const monthOf = wibMonth;
const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7); // calendar math only
};

/** [start, end) of a period: from 00.00 WIB of its first day to 00.00 WIB after its last. */
export function periodRange(p: UsagePeriod): { start: Date; end: Date } {
  if (p.kind === "month") return { start: wibDayStart(`${p.month}-01`), end: wibDayStart(`${shiftMonth(p.month, 1)}-01`) };
  if (p.kind === "year") return { start: wibDayStart(`${p.year}-01-01`), end: wibDayStart(`${Number(p.year) + 1}-01-01`) };
  return { start: wibDayStart(p.from), end: new Date(wibDayStart(p.to).getTime() + DAY_MS) };
}

const daysIn = (p: UsagePeriod) => {
  const { start, end } = periodRange(p);
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
};

/** The period right before: the month or year before, or a range of the same length that ends the day before. */
export function previousPeriod(p: UsagePeriod): UsagePeriod {
  if (p.kind === "month") return { kind: "month", month: shiftMonth(p.month, -1) };
  if (p.kind === "year") return { kind: "year", year: String(Number(p.year) - 1) };
  const start = periodRange(p).start.getTime();
  return { kind: "range", from: dayOf(new Date(start - daysIn(p) * DAY_MS)), to: dayOf(new Date(start - DAY_MS)) };
}

export const bucketOf = (p: UsagePeriod): "day" | "month" =>
  p.kind === "year" || (p.kind === "range" && daysIn(p) > DAILY_MAX_DAYS) ? "month" : "day";

/** The chart keys of a period, oldest first: WIB days ("2026-11-13") or months ("2026-11"), as bucketOf decides. */
export function bucketKeys(p: UsagePeriod): string[] {
  const { start, end } = periodRange(p);
  const keys: string[] = [];
  if (bucketOf(p) === "day") for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) keys.push(dayOf(new Date(t)));
  else for (let m = monthOf(start), last = monthOf(new Date(end.getTime() - 1)); m <= last; m = shiftMonth(m, 1)) keys.push(m);
  return keys;
}

/** Every bucket of the period, oldest first, with zeros where nothing happened. */
export function fillBuckets(p: UsagePeriod, rows: UsageBucket[]): UsageBucket[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return bucketKeys(p).map((date) => byDate.get(date) ?? { date, inputTokens: 0, outputTokens: 0 });
}

const isRealDay = (day: string) => DAY.test(day) && dayOf(wibDayStart(day)) === day;

/** Why a date range cannot be shown, or null when it can. `today` is the WIB day the page was opened. */
export function rangeError(from: string, to: string, today: string): RangeProblem | null {
  if (!isRealDay(from) || !isRealDay(to)) return "invalid";
  if (from > to) return "order";
  if (to > today) return "future";
  return daysIn({ kind: "range", from, to }) > RANGE_MAX_DAYS ? "too_long" : null;
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/** A period from the URL; anything invalid or in the future falls back to this month. */
export function parsePeriod(params: Record<string, string | string[] | undefined>, now: Date): UsagePeriod {
  const current: UsagePeriod = { kind: "month", month: monthOf(now) };
  const [period, month, year, from, to] = ["period", "month", "year", "from", "to"].map((k) => one(params[k]));
  if (period === "year") return YEAR.test(year) && year <= String(wibClock(now).getUTCFullYear()) ? { kind: "year", year } : current;
  if (period === "range") return rangeError(from, to, dayOf(now)) ? current : { kind: "range", from, to };
  return MONTH.test(month) && month <= current.month ? { kind: "month", month } : current;
}

type Pages = { page: number; modelPage: number };

/** Page numbers come already checked (parsePageParam); the period, sort and search are checked here. */
export function parseUsageQuery(params: Record<string, string | string[] | undefined>, pages: Pages, now: Date): UsageQuery {
  const q = one(params.q).trim().slice(0, SEARCH_MAX);
  const sort = USAGE_SORTS.find((s) => s === params.sort) ?? "tokens";
  return { period: parsePeriod(params, now), sort, search: q || null, ...pages };
}

/** URL parameters of a period (read back by parsePeriod); this month is the default and is left out. */
export function periodParams(p: UsagePeriod, currentMonth: string): URLSearchParams {
  const params = new URLSearchParams();
  if (p.kind !== "month") params.set("period", p.kind);
  if (p.kind === "year") params.set("year", p.year);
  if (p.kind === "range") params.set("from", p.from);
  if (p.kind === "range") params.set("to", p.to);
  if (p.kind === "month" && p.month !== currentMonth) params.set("month", p.month);
  return params;
}

/** The usage URL; defaults (this month, by tokens, no search, page 1 of each table) are left out. */
export function usageHref(query: UsageFilters, currentMonth: string, { page = 1, modelPage = 1 }: Partial<Pages> = {}): string {
  const params = periodParams(query.period, currentMonth);
  if (query.sort !== "tokens") params.set("sort", query.sort);
  if (query.search) params.set("q", query.search);
  if (modelPage > 1) params.set("mpage", String(modelPage));
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/usage?${text}` : "/admin/usage";
}

/** Months (newest first) from the first request's month, or this month, to now; at most USAGE_MONTHS_MAX. */
export function monthOptions(first: Date | null, now: Date): string[] {
  const oldest = monthOf(first && first < now ? first : now);
  const out = [monthOf(now)];
  while (out.length < USAGE_MONTHS_MAX && out[out.length - 1] > oldest) out.push(shiftMonth(out[out.length - 1], -1));
  return out;
}

/** Years (newest first) from the first request's year, or this year, to now; at most USAGE_YEARS_MAX. */
export function yearOptions(first: Date | null, now: Date): string[] {
  const oldest = wibClock(first && first < now ? first : now).getUTCFullYear();
  const year = wibClock(now).getUTCFullYear();
  const count = Math.min(USAGE_YEARS_MAX, year - oldest + 1);
  return Array.from({ length: count }, (_, i) => String(year - i));
}

/** Part of a whole in basis points; null when the whole is zero. */
export const shareBp = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part * BP) / whole) : null);

/** Change against the previous period in basis points; null when the previous period had nothing. */
export const changeBp = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) * BP) / previous) : null;
