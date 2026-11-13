import "server-only";
import { type SQL, and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import {
  type ModelUsage, type UsageBucket, type UsagePeriod, type UsageQuery, type UsageReport, type UsageSort, type UsageTotals,
  type UserUsage, USAGE_MODELS_PAGE_SIZE, USAGE_USERS_PAGE_SIZE, bucketOf, fillBuckets, previousPeriod,
} from "@/lib/admin-gateway/usage-contract";
import { db } from "../db/client";
import { likeContains } from "../db/like-pattern";
import { gatewayRequests, modelPrices, users } from "../db/schema";
import { sqlNumber as num } from "../db/sql-number";
import { inPeriod, periodLists, rowTokens } from "./period-sql";

// Admin Usage page: tokens and money per model and per user for one WIB period (month, year or date range).
// Callers check the admin session.
// Failed requests carry no tokens or charge (null), so sums count only what was used; requests count every row.

const g = gatewayRequests;
const sums = {
  requests: num(sql`count(*)`),
  inputTokens: num(sql`sum(${g.inputTokens})`),
  outputTokens: num(sql`sum(${g.outputTokens})`),
  chargeMicros: num(sql`sum(${g.chargeMicros})`),
  costMicros: num(sql`sum(${g.surplusCostMicros})`),
  knownCostChargeMicros: num(sql`sum(${g.chargeMicros}) filter (where ${g.surplusCostMicros} is not null)`),
};
const orderBy: Record<UsageSort, SQL> = {
  tokens: sql`sum(${rowTokens})`,
  charge: sql`coalesce(sum(${g.chargeMicros}), 0)`,
  requests: sql`count(*)`,
};

async function totals(period: UsagePeriod): Promise<UsageTotals> {
  const [row] = await db
    .select({
      requests: sums.requests,
      inputTokens: sums.inputTokens,
      outputTokens: sums.outputTokens,
      failed: num(sql`count(*) filter (where ${g.state} = 'failed')`),
      users: num(sql`count(distinct ${g.userId})`),
      models: num(sql`count(distinct ${g.modelId})`),
    })
    .from(g)
    .where(inPeriod(period));
  return row;
}

/** Tokens per WIB day, or per WIB month for a year or a long range (the same keys fillBuckets makes). */
async function buckets(period: UsagePeriod): Promise<UsageBucket[]> {
  // sql.raw only ever gets one of these two fixed strings, never request input.
  const shape = bucketOf(period) === "day" ? "YYYY-MM-DD" : "YYYY-MM";
  const day = sql<string>`to_char(${g.createdAt} at time zone 'Asia/Jakarta', ${sql.raw(`'${shape}'`)})`;
  const rows = await db
    .select({ date: day, inputTokens: sums.inputTokens, outputTokens: sums.outputTokens })
    .from(g)
    .where(inPeriod(period))
    .groupBy(day);
  return fillBuckets(period, rows);
}

/** Models used in the period, one page at a time; the page is clamped to the last one. */
async function modelPage({ period, sort, modelPage: wanted }: UsageQuery): Promise<UsageReport["models"]> {
  const [{ total }] = await db.select({ total: num(sql`count(distinct ${g.modelId})`) }).from(g).where(inPeriod(period));
  const pages = Math.max(1, Math.ceil(total / USAGE_MODELS_PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const rows: ModelUsage[] = await db
    .select({
      modelId: g.modelId,
      name: sql<string | null>`max(${modelPrices.name})`,
      ...sums,
      failed: num(sql`count(*) filter (where ${g.state} = 'failed')`),
      users: num(sql`count(distinct ${g.userId})`),
    })
    .from(g)
    .leftJoin(modelPrices, eq(modelPrices.modelId, g.modelId))
    .where(inPeriod(period))
    .groupBy(g.modelId)
    .orderBy(desc(orderBy[sort]), asc(g.modelId))
    .limit(USAGE_MODELS_PAGE_SIZE)
    .offset((page - 1) * USAGE_MODELS_PAGE_SIZE);
  return { rows, page, pages, total };
}

/** One row per account that made a request in the period, searchable by email, one page at a time. */
async function userPage(query: UsageQuery): Promise<UsageReport["users"]> {
  const where = and(inPeriod(query.period), query.search ? ilike(users.email, likeContains(query.search)) : undefined);
  const grouped = db
    .select({ userId: g.userId })
    .from(g)
    .leftJoin(users, eq(users.id, g.userId))
    .where(where)
    .groupBy(g.userId)
    .as("grouped");
  const [{ total }] = await db.select({ total: count() }).from(grouped);
  const pages = Math.max(1, Math.ceil(total / USAGE_USERS_PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const rows: UserUsage[] = await db
    .select({ email: users.email, ...sums, models: num(sql`count(distinct ${g.modelId})`) })
    .from(g)
    .leftJoin(users, eq(users.id, g.userId))
    .where(where)
    .groupBy(g.userId, users.email)
    .orderBy(desc(orderBy[query.sort]), asc(g.userId))
    .limit(USAGE_USERS_PAGE_SIZE)
    .offset((page - 1) * USAGE_USERS_PAGE_SIZE);
  return { rows, page, pages, total };
}

export async function usageReport(query: UsageQuery, now: Date): Promise<UsageReport> {
  const { period } = query;
  const previous = previousPeriod(period);
  const [{ months, years }, current, before, daily, byModel, byUser] = await Promise.all([
    periodLists(period, now),
    totals(period),
    totals(previous),
    buckets(period),
    modelPage(query),
    userPage(query),
  ]);
  return {
    period, previous, months, years, totals: current, previousTotals: before,
    bucket: bucketOf(period), buckets: daily, models: byModel, users: byUser,
  };
}
