import "server-only";
import { desc, eq, gte, sql } from "drizzle-orm";
import { TREND_DAYS, type TopModel, type TopUser, type TrendDay, fillDays } from "@/lib/admin-overview-contract";
import { db } from "../db/client";
import { sqlNumber as num } from "../db/sql-number";
import { gatewayRequests, userBalances, users } from "../db/schema";
import { monthStartUtc } from "./figures";

// Trends and leaders of the admin overview (PRD admin-overview §3.3–3.4, K3). Callers check the admin session.

const g = gatewayRequests;
const TOP = 5;

/** 30 UTC days: charge vs known Surplus cost, requests and failures per day; empty days filled with zeros. */
export async function trend(now: Date): Promise<TrendDay[]> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const since = new Date(today - (TREND_DAYS - 1) * 86_400_000);
  const day = sql<string>`to_char(${g.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
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

export async function topModels(now: Date): Promise<TopModel[]> {
  return db
    .select({
      modelId: g.modelId,
      requests: num(sql`count(*)`),
      inputTokens: num(sql`sum(${g.inputTokens})`),
      outputTokens: num(sql`sum(${g.outputTokens})`),
      chargeMicros: num(sql`sum(${g.chargeMicros})`),
      costMicros: num(sql`sum(${g.surplusCostMicros})`),
      knownCostChargeMicros: num(sql`sum(${g.chargeMicros}) filter (where ${g.surplusCostMicros} is not null)`),
    })
    .from(g)
    .where(gte(g.createdAt, monthStartUtc(now)))
    .groupBy(g.modelId)
    .orderBy(desc(sql`coalesce(sum(${g.chargeMicros}), 0)`), desc(sql`count(*)`))
    .limit(TOP);
}

/** Users by usage this month; a deleted account keeps its rows with a null email. */
export async function topUsers(now: Date): Promise<TopUser[]> {
  return db
    .select({
      email: users.email,
      requests: num(sql`count(*)`),
      chargeMicros: num(sql`sum(${g.chargeMicros})`),
      balanceMicros: num(sql`max(${userBalances.balanceMicros})`),
    })
    .from(g)
    .leftJoin(users, eq(users.id, g.userId))
    .leftJoin(userBalances, eq(userBalances.userId, g.userId))
    .where(gte(g.createdAt, monthStartUtc(now)))
    .groupBy(g.userId, users.email)
    .orderBy(desc(sql`coalesce(sum(${g.chargeMicros}), 0)`), desc(sql`count(*)`))
    .limit(TOP);
}
