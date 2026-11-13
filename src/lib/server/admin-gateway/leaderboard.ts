import "server-only";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  type Favourite, type LeaderModel, type LeaderUser, type Leaderboard, LEADERBOARD_SIZE, ranks,
} from "@/lib/admin-gateway/leaderboard-contract";
import type { UsagePeriod } from "@/lib/admin-gateway/usage-contract";
import { db } from "../db/client";
import { gatewayRequests as g, modelPrices, users } from "../db/schema";
import { sqlNumber as num } from "../db/sql-number";
import { inPeriod, periodLists, rowTokens } from "./period-sql";

// Admin Leaderboard: the accounts and the models with the most tokens (input + output) in one UTC period.
// Callers check the admin session. Rows with 0 tokens (only failed requests) are left out: they used nothing.
// Deleted accounts count in the totals but never rank: their rows no longer say whose they were.

const tokenSum = num(sql`sum(${rowTokens})`);
const byTokens = sql`sum(${rowTokens})`;
/**
 * Owner 2026-11-13: both lists count requests without the failed ones (running ones still count), and an account's
 * model count leaves out models it only failed on.
 */
const notFailed = num(sql`count(*) filter (where ${g.state} <> 'failed')`);

async function totals(period: UsagePeriod) {
  const [row] = await db
    .select({
      totalTokens: tokenSum,
      activeUsers: num(sql`count(distinct ${g.userId})`),
      usedModels: num(sql`count(distinct ${g.modelId})`),
    })
    .from(g)
    .where(inPeriod(period));
  return row;
}

/** For each account, the model with the most tokens (ties: the first in text order). */
function favourites(rows: { key: string; label: string; tokens: number }[]): Map<string, Favourite> {
  const best = new Map<string, Favourite>();
  for (const r of rows) {
    const held = best.get(r.key);
    if (!held || r.tokens > held.tokens || (r.tokens === held.tokens && r.label < held.label)) {
      best.set(r.key, { label: r.label, tokens: r.tokens });
    }
  }
  return best;
}

async function topUsers(period: UsagePeriod): Promise<LeaderUser[]> {
  const rows = await db
    .select({
      userId: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName,
      tokens: tokenSum, requests: notFailed,
      models: num(sql`count(distinct ${g.modelId}) filter (where ${g.state} <> 'failed')`),
    })
    .from(g)
    .innerJoin(users, eq(users.id, g.userId))
    .where(inPeriod(period))
    .groupBy(users.id)
    .having(gt(byTokens, 0))
    .orderBy(desc(byTokens), asc(users.email))
    .limit(LEADERBOARD_SIZE);
  if (rows.length === 0) return [];
  const label = sql<string>`coalesce(max(${modelPrices.name}), ${g.modelId})`;
  const split = await db
    .select({ key: g.userId, label, tokens: tokenSum })
    .from(g)
    .leftJoin(modelPrices, eq(modelPrices.modelId, g.modelId))
    .where(and(inPeriod(period), inArray(g.userId, rows.map((r) => r.userId))))
    .groupBy(g.userId, g.modelId);
  const top = favourites(split.map((s) => ({ ...s, key: s.key! })));
  const rank = ranks(rows.map((r) => r.tokens));
  return rows.map((r, i) => ({ ...r, rank: rank[i], topModel: top.get(r.userId) ?? null }));
}

async function topModels(period: UsagePeriod): Promise<LeaderModel[]> {
  const rows = await db
    .select({
      modelId: g.modelId, name: sql<string | null>`max(${modelPrices.name})`,
      tokens: tokenSum, requests: notFailed,
    })
    .from(g)
    .leftJoin(modelPrices, eq(modelPrices.modelId, g.modelId))
    .where(inPeriod(period))
    .groupBy(g.modelId)
    .having(gt(byTokens, 0))
    .orderBy(desc(byTokens), asc(g.modelId))
    .limit(LEADERBOARD_SIZE);
  const rank = ranks(rows.map((r) => r.tokens));
  return rows.map((r, i) => ({ ...r, rank: rank[i] }));
}

export async function leaderboard(period: UsagePeriod, now: Date): Promise<Leaderboard> {
  const [lists, sums, byUser, byModel] = await Promise.all([
    periodLists(period, now), totals(period), topUsers(period), topModels(period),
  ]);
  return { period, ...lists, ...sums, users: byUser, models: byModel };
}
