import "server-only";
import { and, gte, lt, min, sql } from "drizzle-orm";
import { type UsagePeriod, monthOptions, periodRange, yearOptions } from "@/lib/admin-gateway/usage-contract";
import { db } from "../db/client";
import { gatewayRequests as g } from "../db/schema";

// Period pieces shared by the admin Usage and Leaderboard queries. Failed requests carry no tokens (null).

/** Requests made inside the period ([start, end) in UTC). */
export const inPeriod = (period: UsagePeriod) => {
  const { start, end } = periodRange(period);
  return and(gte(g.createdAt, start), lt(g.createdAt, end));
};

/** Input + output tokens of one request; 0 when the request carries none. */
export const rowTokens = sql`coalesce(${g.inputTokens}, 0) + coalesce(${g.outputTokens}, 0)`;

/**
 * Months and years for the picker, from the first request to now. A valid month or year older than the lists (typed
 * into the URL) still shows up as the picked option.
 */
export async function periodLists(period: UsagePeriod, now: Date): Promise<{ months: string[]; years: string[] }> {
  const [first] = await db.select({ at: min(g.createdAt) }).from(g);
  const months = monthOptions(first?.at ?? null, now);
  const years = yearOptions(first?.at ?? null, now);
  if (period.kind === "month" && !months.includes(period.month)) months.push(period.month);
  if (period.kind === "year" && !years.includes(period.year)) years.push(period.year);
  return { months, years };
}
