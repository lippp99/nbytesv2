import "server-only";
import { eq, sql } from "drizzle-orm";
import type { SumopodWebhook } from "@/lib/payments/sumopod-contract";
import { db } from "../db/client";
import { balanceLedger, deposits, paymentWebhookEvents, userBalances } from "../db/schema";

// PRD gateway-pricing-billing §6.1 steps 4–5 and §6.3 "Urutan": after the signature check, find the deposit by
// order_id, match payment_id and amount, then change the status and credit the balance in one transaction.
// Idempotent twice over: the svix-id is stored once, and a deposit that is no longer pending is never touched again.

type PaymentEvent = Exclude<SumopodWebhook, { eventType: "payment.test" }>;
export type WebhookResult = "credited" | "status_updated" | "already_final" | "unknown_order" | "mismatch" | "duplicate";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Deposit = typeof deposits.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FINAL_STATUS = { "payment.completed": "paid", "payment.failed": "failed", "payment.expired": "expired" } as const;

export async function applyWebhook(svixId: string, event: PaymentEvent): Promise<WebhookResult> {
  const result = await db.transaction(async (tx) => {
    const [seen] = await tx
      .insert(paymentWebhookEvents)
      .values({ svixId, eventType: event.eventType, paymentId: event.paymentId, result: "processing" })
      .onConflictDoNothing()
      .returning({ id: paymentWebhookEvents.id });
    if (!seen) return "duplicate" as const;
    const outcome = await applyToDeposit(tx, event);
    await tx.update(paymentWebhookEvents).set({ result: outcome }).where(eq(paymentWebhookEvents.id, seen.id));
    return outcome;
  });
  // "Peringatan admin" (§6.3): no alert channel exists yet, so the server log and the stored result carry it.
  if (result === "mismatch" || result === "unknown_order") {
    console.error(`[payments] webhook ${event.eventType} not applied (${result}), order ${event.orderId.slice(0, 64)}`);
  }
  return result;
}

async function applyToDeposit(tx: Tx, event: PaymentEvent): Promise<WebhookResult> {
  if (!UUID.test(event.orderId)) return "unknown_order";
  const [deposit] = await tx.select().from(deposits).where(eq(deposits.id, event.orderId)).for("update");
  if (!deposit) return "unknown_order";
  if (deposit.status !== "pending") return "already_final";
  if (!matches(deposit, event)) return "mismatch";

  const status = FINAL_STATUS[event.eventType];
  await tx
    .update(deposits)
    .set({
      status,
      // Filled here when the create response was lost (timeout): the signature proves Sumopod sent this id.
      sumopodPaymentId: event.paymentId,
      providerFeeIdr: event.fee ?? deposit.providerFeeIdr,
      netAmountIdr: event.netAmount ?? deposit.netAmountIdr,
      paymentMethod: event.paymentMethod,
      paidAt: status === "paid" ? (event.paidAt ?? new Date()) : null,
    })
    .where(eq(deposits.id, deposit.id));
  if (status !== "paid") return "status_updated";
  await credit(tx, deposit.userId!, deposit.id, deposit.creditMicros);
  return "credited";
}

/** Same Sumopod payment (when we know its id), the exact rupiah we asked for, and a user to credit. */
function matches(deposit: Deposit, event: PaymentEvent): boolean {
  if (deposit.sumopodPaymentId && deposit.sumopodPaymentId !== event.paymentId) return false;
  if (event.amount !== deposit.amountIdr + deposit.feeIdr) return false;
  return deposit.userId !== null; // account deleted meanwhile (B6 blocks that): nobody to credit, an admin decides
}

/** §8: ledger row and summary row in the same transaction; the upsert locks the user's summary row. */
async function credit(tx: Tx, userId: string, depositId: string, micros: number): Promise<void> {
  await tx.insert(balanceLedger).values({ userId, kind: "deposit", amountMicros: micros, depositId });
  await tx
    .insert(userBalances)
    .values({ userId, balanceMicros: micros })
    .onConflictDoUpdate({
      target: userBalances.userId,
      set: { balanceMicros: sql`${userBalances.balanceMicros} + ${micros}`, updatedAt: sql`now()` },
    });
}
