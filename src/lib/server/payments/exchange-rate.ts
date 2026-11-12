import "server-only";
import { desc } from "drizzle-orm";
import { db } from "../db/client";
import { logAdminEvent } from "../admin-auth/audit";
import { exchangeRates } from "../db/schema";

// Manual rate "1 USD = X rupiah" (PRD gateway-pricing-billing §5). No default in code: no row -> no deposits.

/** The rate in force (newest row), or null when an admin has never set one. */
export async function currentIdrPerUsd(): Promise<number | null> {
  const [row] = await db
    .select({ idrPerUsd: exchangeRates.idrPerUsd })
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.createdAt))
    .limit(1);
  return row?.idrPerUsd ?? null;
}

/**
 * New row plus an audit event in one transaction. Who and when are on both rows; old and new values are the previous
 * and this row of exchange_rates, which is never updated (§5.1).
 */
export async function setExchangeRate(adminId: string, idrPerUsd: number, ipHash: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.insert(exchangeRates).values({ idrPerUsd, setBy: adminId }).returning({ id: exchangeRates.id });
    await logAdminEvent("exchange_rate_set", { adminId, ipHash }, { target: row.id }, tx);
  });
}
