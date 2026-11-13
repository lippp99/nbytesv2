import "server-only";
import { type SQL, and, desc, eq, gte, sql } from "drizzle-orm";
import { STOPPED_ERROR_CODE, type UsageData, fillUsageDays, windowStart } from "@/lib/usage-contract";
import { db } from "../db/client";
import { apiKeys, gatewayRequests, modelPrices } from "../db/schema";

// Usage page of one user (PRD dashboard-usage §5.1): every query is scoped to the session's user and the last 30 WIB
// days. Cost is what was charged (charge_micros); holds of running requests are counted, not added (F4).

const g = gatewayRequests;
const num = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);
const charged = () => num(sql`sum(${g.chargeMicros})`);
const requests = () => num(sql`count(*)`);
const tokens = () => num(sql`sum(coalesce(${g.inputTokens}, 0) + coalesce(${g.outputTokens}, 0))`);
const byChargeThenCount = [desc(sql`coalesce(sum(${g.chargeMicros}), 0)`), desc(sql`count(*)`)];

async function summary(where: SQL | undefined) {
  const [row] = await db
    .select({
      chargeMicros: charged(),
      requests: requests(),
      errors: num(sql`count(*) filter (where ${g.state} = 'failed' and ${g.errorCode} is distinct from ${STOPPED_ERROR_CODE})`),
      stopped: num(sql`count(*) filter (where ${g.state} = 'failed' and ${g.errorCode} = ${STOPPED_ERROR_CODE})`),
      pending: num(sql`count(*) filter (where ${g.state} = 'pending')`),
      tokens: tokens(),
      medianMs: sql<number | null>`percentile_disc(0.5) within group (order by ${g.latencyMs}) filter (where ${g.state} = 'succeeded')`
        .mapWith((v) => (v === null ? null : Number(v))),
    })
    .from(g)
    .where(where);
  return row;
}

async function byDay(where: SQL | undefined) {
  const day = sql<string>`to_char(${g.createdAt} at time zone 'Asia/Jakarta', 'YYYY-MM-DD')`;
  return db.select({ date: day, chargeMicros: charged() }).from(g).where(where).groupBy(day);
}

async function byModel(where: SQL | undefined) {
  return db
    .select({ modelId: g.modelId, name: modelPrices.name, requests: requests(), tokens: tokens(), chargeMicros: charged() })
    .from(g)
    .leftJoin(modelPrices, eq(modelPrices.modelId, g.modelId))
    .where(where)
    .groupBy(g.modelId, modelPrices.name)
    .orderBy(...byChargeThenCount);
}

async function byKey(where: SQL | undefined) {
  const rows = await db
    .select({
      keyId: g.apiKeyId, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, revokedAt: apiKeys.revokedAt,
      requests: requests(), chargeMicros: charged(),
    })
    .from(g)
    .leftJoin(apiKeys, eq(apiKeys.id, g.apiKeyId))
    .where(where)
    .groupBy(g.apiKeyId, apiKeys.name, apiKeys.keyPrefix, apiKeys.revokedAt)
    .orderBy(...byChargeThenCount);
  return rows.map(({ revokedAt, ...row }) => ({ ...row, revoked: revokedAt !== null }));
}

/** The four parts of the Usage page, read in parallel. */
export async function userUsage(userId: string, now = new Date()): Promise<UsageData> {
  const where = and(eq(g.userId, userId), gte(g.createdAt, windowStart(now)));
  const [s, days, models, keys] = await Promise.all([summary(where), byDay(where), byModel(where), byKey(where)]);
  return { summary: s, days: fillUsageDays(days, now), models, keys };
}
