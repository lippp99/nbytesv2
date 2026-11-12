import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { balanceLedger, gatewayRequests, userBalances } from "../db/schema";
import { AppError } from "../errors";

// Hold then charge (PRD gateway-pricing-billing §8, §9; gateway-api §7 steps 7 and 9). Ledger and summary row change in
// the same transaction, with the user's balance row locked so parallel requests cannot spend the same money.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type HoldInput = {
  /** keyId null: the Playground (no key, no key budget). */
  userId: string; keyId: string | null; monthlyBudgetMicros: number | null;
  modelId: string; endpoint: string; stream: boolean; holdMicros: number;
};

export type Settlement = {
  state: "succeeded" | "failed";
  chargeMicros: number;
  inputTokens: number | null;
  outputTokens: number | null;
  surplusRequestId: string | null;
  /** null = unknown, never read as 0 (§10.1); the row is then marked for reconciliation. */
  surplusCostMicros: number | null;
  statusCode: number;
  errorCode: string | null;
  latencyMs: number;
  /** Telemetry for the admin (PRD admin-requests-upstream §5): Surplus's own error code, x-si-provider-family, x-si-truncated. */
  upstreamErrorCode?: string | null;
  upstreamFamily?: string | null;
  truncated?: boolean | null;
};

export const monthStartUtc = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

/**
 * A key's spend over the gateway_requests rows in scope: settled charges, plus holds of requests still running. The
 * budget check below and the API Keys page both use it, so the page shows the number requests are refused on.
 */
export const keySpentSql = () =>
  sql<number>`coalesce(sum(coalesce(${gatewayRequests.chargeMicros}, ${gatewayRequests.holdMicros})), 0)`.mapWith(Number);

/** Spent by this key this month (UTC). */
async function keySpentThisMonth(tx: Tx, keyId: string): Promise<number> {
  const [row] = await tx
    .select({ spent: keySpentSql() })
    .from(gatewayRequests)
    .where(and(eq(gatewayRequests.apiKeyId, keyId), gte(gatewayRequests.createdAt, monthStartUtc(new Date()))));
  return row.spent;
}

/** §9.1–2: refuses (402) when the available balance or the key's monthly budget cannot cover the hold. */
export async function holdForRequest(input: HoldInput): Promise<string> {
  return db.transaction(async (tx) => {
    const [balance] = await tx.select().from(userBalances).where(eq(userBalances.userId, input.userId)).for("update");
    // B7: a balance at or below zero refuses every request until a deposit brings it back above zero.
    if (!balance || balance.balanceMicros <= 0 || balance.balanceMicros - balance.heldMicros < input.holdMicros) {
      throw new AppError("insufficient_balance", 402);
    }
    if (input.keyId !== null && input.monthlyBudgetMicros !== null) {
      // The balance row lock above also serialises this check: every key of one user locks the same row.
      if ((await keySpentThisMonth(tx, input.keyId)) + input.holdMicros > input.monthlyBudgetMicros) {
        throw new AppError("key_budget_exceeded", 402);
      }
    }
    const [request] = await tx
      .insert(gatewayRequests)
      .values({
        userId: input.userId, apiKeyId: input.keyId, modelId: input.modelId, endpoint: input.endpoint,
        stream: input.stream, holdMicros: input.holdMicros,
      })
      .returning({ id: gatewayRequests.id });
    await tx.insert(balanceLedger).values({ userId: input.userId, kind: "hold", amountMicros: -input.holdMicros, requestId: request.id });
    await tx
      .update(userBalances)
      .set({ heldMicros: sql`${userBalances.heldMicros} + ${input.holdMicros}`, updatedAt: sql`now()` })
      .where(eq(userBalances.userId, input.userId));
    return request.id;
  });
}

/**
 * §9.3–4: releases the hold and charges the real amount, once (a request that is no longer pending is left alone).
 * A charge above the hold is taken in full; the balance may go slightly negative (B7).
 */
export async function settleRequest(requestId: string, outcome: Settlement): Promise<void> {
  await db.transaction(async (tx) => {
    const [request] = await tx.select().from(gatewayRequests).where(eq(gatewayRequests.id, requestId)).for("update");
    if (!request || request.state !== "pending" || !request.userId) return;
    const { userId, holdMicros } = request;
    await tx.select({ userId: userBalances.userId }).from(userBalances).where(eq(userBalances.userId, userId)).for("update");
    const rows: (typeof balanceLedger.$inferInsert)[] = [{ userId, kind: "hold_release", amountMicros: holdMicros, requestId }];
    if (outcome.chargeMicros > 0) rows.push({ userId, kind: "usage", amountMicros: -outcome.chargeMicros, requestId });
    await tx.insert(balanceLedger).values(rows);
    await tx
      .update(userBalances)
      .set({
        heldMicros: sql`${userBalances.heldMicros} - ${holdMicros}`,
        balanceMicros: sql`${userBalances.balanceMicros} - ${outcome.chargeMicros}`,
        updatedAt: sql`now()`,
      })
      .where(eq(userBalances.userId, userId));
    await tx
      .update(gatewayRequests)
      .set({ ...outcome, costStatus: outcome.surplusCostMicros === null ? "pending" : "known" })
      .where(eq(gatewayRequests.id, requestId));
  });
}
