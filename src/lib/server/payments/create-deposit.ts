import "server-only";
import { eq } from "drizzle-orm";
import { type CreatedDeposit, DEPOSIT_EXPIRES_HOURS, quoteDeposit } from "@/lib/payments/deposit-contract";
import { authEnv } from "../auth/auth-env";
import { logServerError } from "../auth/request-guard";
import { hit } from "../auth/rate-limit";
import { db } from "../db/client";
import { deposits } from "../db/schema";
import { AppError, rateLimitedError } from "../errors";
import { currentIdrPerUsd } from "./exchange-rate";
import { paymentsEnv } from "./payments-env";
import { createPayment, SumopodError } from "./sumopod-client";

// PRD gateway-pricing-billing §6.1 steps 1–3: lock the rate, store the pending deposit, create the Sumopod payment.
// Only the verified webhook credits the balance; the return URL proves nothing (§6.1).

const LIMIT = { count: 10, windowSeconds: 60 * 60 }; // owner, 2026-11-11: 10 deposit requests per hour per account
const HOUR_MS = 60 * 60 * 1000;

export async function createDeposit(userId: string, amountIdr: number): Promise<CreatedDeposit> {
  paymentsEnv(); // missing config fails here (503, logged) instead of leaving a deposit row without a payment
  const wait = await hit(`deposit-create:user:${userId}`, LIMIT.count, LIMIT.windowSeconds);
  if (wait) throw rateLimitedError(wait);
  const idrPerUsd = await currentIdrPerUsd();
  if (!idrPerUsd) throw new AppError("unavailable", 503, {}, undefined, { cause: new Error("no exchange rate set") });

  const quote = quoteDeposit(amountIdr, idrPerUsd);
  const expiresAt = new Date(Date.now() + DEPOSIT_EXPIRES_HOURS * HOUR_MS);
  const [row] = await db
    .insert(deposits)
    .values({ userId, amountIdr, feeIdr: quote.feeIdr, idrPerUsd, creditMicros: quote.creditMicros, expiresAt })
    .returning({ id: deposits.id });

  try {
    const payment = await createPayment({
      orderId: row.id,
      amountIdr: quote.totalIdr,
      expiresInHours: DEPOSIT_EXPIRES_HOURS,
      returnUrl: `${authEnv().appOrigin}/billing?deposit=${row.id}`,
    });
    await db
      .update(deposits)
      .set({
        sumopodPaymentId: payment.paymentId,
        paymentLinkUrl: payment.paymentLinkUrl,
        paymentCode: payment.paymentCode,
        paymentCodeType: payment.paymentCodeType,
        paymentChannelUsed: payment.paymentChannelUsed,
        providerFeeIdr: payment.fee,
        netAmountIdr: payment.netAmount,
        expiresAt: payment.expiresAt,
      })
      .where(eq(deposits.id, row.id));
    return { ...quote, id: row.id, paymentLinkUrl: payment.paymentLinkUrl, expiresAt: payment.expiresAt.toISOString() };
  } catch (error) {
    // Refused by Sumopod: no payment exists, so the request is closed. Unknown: it stays pending (see SumopodError).
    if (error instanceof SumopodError && error.kind === "refused") {
      await db.update(deposits).set({ status: "failed" }).where(eq(deposits.id, row.id)).catch(logServerError);
    }
    throw new AppError("unavailable", 503, {}, undefined, { cause: error });
  }
}
