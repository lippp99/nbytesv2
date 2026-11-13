import "server-only";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type { DayFigures, MonthFigures, MoneyHealth, UserFigures } from "@/lib/admin-overview-contract";
import { db } from "../db/client";
import { sqlNumber as num } from "../db/sql-number";
import { deposits, exchangeRates, gatewayRequests, userBalances, users } from "../db/schema";
import { surplusBalance } from "../admin-gateway/upstream-health";

// Headline figures of the admin overview (PRD admin-overview §3.1–3.2). Callers check the admin session.

const g = gatewayRequests;
const DAY_MS = 86_400_000;

export const monthStartUtc = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

/** K1: usage charged, Surplus cost of the known-cost requests, and paid deposits, each on its own. */
export async function monthFigures(now: Date): Promise<MonthFigures> {
  const since = monthStartUtc(now);
  const [[usage], [paid]] = await Promise.all([
    db
      .select({
        chargeMicros: num(sql`sum(${g.chargeMicros})`),
        knownCostMicros: num(sql`sum(${g.surplusCostMicros})`),
        knownCostChargeMicros: num(sql`sum(${g.chargeMicros}) filter (where ${g.surplusCostMicros} is not null)`),
        costPending: num(sql`count(*) filter (where ${g.costStatus} = 'pending')`),
      })
      .from(g)
      .where(gte(g.createdAt, since)),
    db
      .select({
        depositIdr: num(sql`sum(${deposits.amountIdr} + ${deposits.feeIdr})`),
        depositCreditMicros: num(sql`sum(${deposits.creditMicros})`),
        depositCount: count(),
      })
      .from(deposits)
      .where(and(eq(deposits.status, "paid"), gte(deposits.paidAt, since))),
  ]);
  return { ...usage, ...paid };
}

export async function dayFigures(now: Date): Promise<DayFigures> {
  const [row] = await db
    .select({
      requests: count(),
      failed: num(sql`count(*) filter (where ${g.state} = 'failed')`),
      failedOurs: num(sql`count(*) filter (where ${g.errorCode} = 'service_unavailable')`),
      p50LatencyMs: sql<number | null>`percentile_disc(0.5) within group (order by ${g.latencyMs})`
        .mapWith((v) => (v === null ? null : Number(v))),
    })
    .from(g)
    .where(gte(g.createdAt, new Date(now.getTime() - DAY_MS)));
  return row;
}

/** K2: active = at least one API request in the last 30 days. */
export async function userFigures(now: Date): Promise<UserFigures> {
  const [[accounts], [active]] = await Promise.all([
    db
      .select({
        total: count(),
        newThisMonth: num(sql`count(*) filter (where ${users.createdAt} >= ${monthStartUtc(now)})`),
        suspended: num(sql`count(*) filter (where ${users.status} = 'suspended')`),
      })
      .from(users),
    db
      .select({ active30: num(sql`count(distinct ${g.userId})`) })
      .from(g)
      .where(gte(g.createdAt, new Date(now.getTime() - 30 * DAY_MS))),
  ]);
  return { ...accounts, ...active };
}

/** §3.2: what users can still spend against nbytes' Surplus credit, the rate and open deposits. */
export async function moneyHealth(now: Date): Promise<MoneyHealth> {
  const [surplus, [balances], [rate], [open]] = await Promise.all([
    surplusBalance(),
    db
      .select({
        userBalanceMicros: num(sql`sum(${userBalances.balanceMicros})`),
        userHeldMicros: num(sql`sum(${userBalances.heldMicros})`),
        negativeBalances: num(sql`count(*) filter (where ${userBalances.balanceMicros} < 0)`),
      })
      .from(userBalances),
    db.select({ idrPerUsd: exchangeRates.idrPerUsd, setAt: exchangeRates.createdAt }).from(exchangeRates)
      .orderBy(desc(exchangeRates.createdAt)).limit(1),
    db
      .select({
        depositsPending: num(sql`count(*) filter (where ${deposits.expiresAt} >= ${now})`),
        depositsStuck: num(sql`count(*) filter (where ${deposits.expiresAt} < ${now})`),
      })
      .from(deposits)
      .where(eq(deposits.status, "pending")),
  ]);
  return {
    surplus, ...balances, ...open,
    idrPerUsd: rate?.idrPerUsd ?? null, rateSetAt: rate?.setAt.toISOString() ?? null,
  };
}
