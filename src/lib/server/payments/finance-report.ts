import "server-only";
import { type AnyColumn, type SQL, and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  type DepositFilter, type DepositSummary, type DepositsPage, DEPOSITS_PAGE_SIZE, type ExchangeRateEntry, depositState,
} from "@/lib/payments/finance-contract";
import { db } from "../db/client";
import { admins, deposits, exchangeRates, users } from "../db/schema";

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

/** Paid deposits since the 1st of this month (UTC, by paid_at), plus stuck deposits of any month. */
export async function depositSummary(): Promise<DepositSummary> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [[paid], [stuck]] = await Promise.all([
    db
      .select({
        paidCount: count(),
        receivedIdr: total(sql`${deposits.amountIdr} + ${deposits.feeIdr}`),
        providerFeeIdr: total(deposits.providerFeeIdr),
        netIdr: total(deposits.netAmountIdr),
        creditMicros: total(deposits.creditMicros),
      })
      .from(deposits)
      .where(and(eq(deposits.status, "paid"), gte(deposits.paidAt, monthStart))),
    db.select({ stuckCount: count() }).from(deposits).where(filterWhere("stuck", now)),
  ]);
  return { ...paid, stuckCount: stuck.stuckCount };
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
