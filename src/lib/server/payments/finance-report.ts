import "server-only";
import { type AnyColumn, type SQL, and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { type UsagePeriod, bucketKeys, bucketOf, periodRange } from "@/lib/admin-gateway/usage-contract";
import {
  type DepositFilter, type DepositsPage, DEPOSITS_PAGE_SIZE, type ExchangeRateEntry, depositState,
} from "@/lib/payments/finance-contract";
import type { ProfitBucket, ProfitSummary } from "@/lib/payments/profit-contract";
import { inPeriod, periodLists } from "../admin-gateway/period-sql";
import { db } from "../db/client";
import { sqlNumber as num } from "../db/sql-number";
import { admins, deposits, exchangeRates, gatewayRequests as g, users } from "../db/schema";

// Read-only queries for the admin Finance page (PRD gateway-pricing-billing §11, B9). Callers check the admin session.

const RATE_HISTORY_LIMIT = 10;
// pg returns sum(bigint) as numeric text; every total here stays far below 2^53, so Number is exact.
const total = (column: SQL | AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);

function filterWhere(filter: DepositFilter, now: Date): SQL | undefined {
  if (filter === "all") return undefined;
  if (filter === "stuck") return and(eq(deposits.status, "pending"), lt(deposits.expiresAt, now));
  if (filter === "pending") return and(eq(deposits.status, "pending"), gte(deposits.expiresAt, now));
  return eq(deposits.status, filter);
}

/** Newest first; the page is clamped to the last one. */
export async function listDeposits(filter: DepositFilter, requestedPage: number): Promise<DepositsPage> {
  const now = new Date();
  const where = filterWhere(filter, now);
  const [{ total: rows }] = await db.select({ total: count() }).from(deposits).where(where);
  const pages = Math.max(1, Math.ceil(rows / DEPOSITS_PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const found = await db
    .select({
      id: deposits.id, createdAt: deposits.createdAt, email: users.email, amountIdr: deposits.amountIdr,
      feeIdr: deposits.feeIdr, idrPerUsd: deposits.idrPerUsd, creditMicros: deposits.creditMicros,
      providerFeeIdr: deposits.providerFeeIdr, status: deposits.status, expiresAt: deposits.expiresAt,
    })
    .from(deposits)
    .leftJoin(users, eq(users.id, deposits.userId))
    .where(where)
    .orderBy(desc(deposits.createdAt))
    .limit(DEPOSITS_PAGE_SIZE)
    .offset((page - 1) * DEPOSITS_PAGE_SIZE);
  return {
    page, pages, total: rows,
    deposits: found.map((d) => ({
      id: d.id, createdAt: d.createdAt.toISOString(), email: d.email, totalIdr: d.amountIdr + d.feeIdr,
      idrPerUsd: d.idrPerUsd, creditMicros: d.creditMicros, providerFeeIdr: d.providerFeeIdr,
      state: depositState(d.status, d.expiresAt, now),
    })),
  };
}

/** Gateway margin inputs per bucket by request time, deposit fees per bucket by payment time; every key filled. */
async function profitBuckets(period: UsagePeriod): Promise<ProfitBucket[]> {
  const { start, end } = periodRange(period);
  // sql.raw only ever gets one of these two fixed strings, never request input.
  const shape = sql.raw(bucketOf(period) === "day" ? "'YYYY-MM-DD'" : "'YYYY-MM'");
  const gDay = sql<string>`to_char(${g.createdAt} at time zone 'Asia/Jakarta', ${shape})`;
  const dDay = sql<string>`to_char(${deposits.paidAt} at time zone 'Asia/Jakarta', ${shape})`;
  const [usage, paid] = await Promise.all([
    db
      .select({
        date: gDay,
        knownCostMicros: total(g.surplusCostMicros),
        knownCostChargeMicros: num(sql`sum(${g.chargeMicros}) filter (where ${g.surplusCostMicros} is not null)`),
      })
      .from(g).where(inPeriod(period)).groupBy(gDay),
    db
      .select({ date: dDay, feeIdr: total(deposits.feeIdr), providerFeeIdr: total(deposits.providerFeeIdr) })
      .from(deposits).where(and(eq(deposits.status, "paid"), gte(deposits.paidAt, start), lt(deposits.paidAt, end))).groupBy(dDay),
  ]);
  const u = new Map(usage.map((r) => [r.date, r]));
  const d = new Map(paid.map((r) => [r.date, r]));
  return bucketKeys(period).map((date) => ({
    date,
    knownCostChargeMicros: u.get(date)?.knownCostChargeMicros ?? 0, knownCostMicros: u.get(date)?.knownCostMicros ?? 0,
    feeIdr: d.get(date)?.feeIdr ?? 0, providerFeeIdr: d.get(date)?.providerFeeIdr ?? 0,
  }));
}

/** One period (WIB days): gateway charge, cost and margin inputs; deposits paid in it; every paid deposit up to its end. */
export async function profitSummary(period: UsagePeriod, now: Date): Promise<ProfitSummary> {
  const { start, end } = periodRange(period);
  const paid = eq(deposits.status, "paid");
  const [[usage], [periodDeposits], [upToEnd], lists, buckets] = await Promise.all([
    db
      .select({
        knownCostMicros: total(g.surplusCostMicros),
        knownCostChargeMicros: num(sql`sum(${g.chargeMicros}) filter (where ${g.surplusCostMicros} is not null)`),
      })
      .from(g)
      .where(inPeriod(period)),
    db
      .select({
        amountIdr: total(deposits.amountIdr), feeIdr: total(deposits.feeIdr), providerFeeIdr: total(deposits.providerFeeIdr),
        creditMicros: total(deposits.creditMicros),
      })
      .from(deposits)
      .where(and(paid, gte(deposits.paidAt, start), lt(deposits.paidAt, end))),
    db
      .select({ allAmountIdr: total(deposits.amountIdr), allCreditMicros: total(deposits.creditMicros) })
      .from(deposits)
      .where(and(paid, lt(deposits.paidAt, end))),
    // shortcut: months/years start at the first gateway request; a deposit-only month before it needs the URL
    periodLists(period, now),
    profitBuckets(period),
  ]);
  return { period, ...lists, ...usage, ...periodDeposits, ...upToEnd, bucket: bucketOf(period), buckets };
}

/** The last rate changes, newest (the one in force) first. */
export async function exchangeRateHistory(): Promise<ExchangeRateEntry[]> {
  const rows = await db
    .select({ idrPerUsd: exchangeRates.idrPerUsd, setAt: exchangeRates.createdAt, setBy: admins.email })
    .from(exchangeRates)
    .leftJoin(admins, eq(admins.id, exchangeRates.setBy))
    .orderBy(desc(exchangeRates.createdAt))
    .limit(RATE_HISTORY_LIMIT);
  return rows.map((r) => ({ ...r, setAt: r.setAt.toISOString() }));
}
