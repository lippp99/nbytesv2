import "server-only";
import { gte, sql } from "drizzle-orm";
import { TREND_DAYS, type TrendDay, fillDays } from "@/lib/admin-overview-contract";
import { db } from "../db/client";
import { sqlNumber as num } from "../db/sql-number";
import { gatewayRequests } from "../db/schema";
import { wibDay, wibDayStart } from "@/lib/date-format";

// The 30-day trend of the admin overview (PRD admin-overview §3.3, K3). Callers check the admin session.

const g = gatewayRequests;

/** 30 WIB days: charge vs known Surplus cost, requests and failures per day; empty days filled with zeros. */
export async function trend(now: Date): Promise<TrendDay[]> {
  const since = new Date(wibDayStart(wibDay(now)).getTime() - (TREND_DAYS - 1) * 86_400_000);
  const day = sql<string>`to_char(${g.createdAt} at time zone 'Asia/Jakarta', 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      date: day,
      chargeMicros: num(sql`sum(${g.chargeMicros})`),
      costMicros: num(sql`sum(${g.surplusCostMicros})`),
      requests: num(sql`count(*)`),
      failed: num(sql`count(*) filter (where ${g.state} = 'failed')`),
    })
    .from(g)
    .where(gte(g.createdAt, since))
    .groupBy(day);
  return fillDays(rows, now);
}
