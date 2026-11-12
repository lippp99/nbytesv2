import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import type { UserBalance, UserDeposit } from "@/lib/payments/deposit-contract";
import { depositState } from "@/lib/payments/finance-contract";
import { db } from "../db/client";
import { deposits, userBalances } from "../db/schema";

// Read-only data for the signed-in user's Billing page and header wallet (PRD gateway-pricing-billing §8, §11).
// Every query is scoped to the caller's own user id, which comes from the session, never from the request.

export const USER_DEPOSITS_PAGE_SIZE = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** No summary row yet (never deposited) -> zero. */
export async function userBalance(userId: string): Promise<UserBalance> {
  const [row] = await db
    .select({ balanceMicros: userBalances.balanceMicros, heldMicros: userBalances.heldMicros })
    .from(userBalances)
    .where(eq(userBalances.userId, userId));
  return row ?? { balanceMicros: 0, heldMicros: 0 };
}

const columns = {
  id: deposits.id, createdAt: deposits.createdAt, amountIdr: deposits.amountIdr, feeIdr: deposits.feeIdr,
  idrPerUsd: deposits.idrPerUsd, creditMicros: deposits.creditMicros, status: deposits.status,
  expiresAt: deposits.expiresAt, paymentLinkUrl: deposits.paymentLinkUrl,
};
type Row = Pick<typeof deposits.$inferSelect, keyof typeof columns>;

function toUserDeposit(d: Row, now: Date): UserDeposit {
  const state = depositState(d.status, d.expiresAt, now);
  return {
    id: d.id, createdAt: d.createdAt.toISOString(), amountIdr: d.amountIdr, totalIdr: d.amountIdr + d.feeIdr,
    idrPerUsd: d.idrPerUsd, creditMicros: d.creditMicros, state,
    paymentLinkUrl: state === "pending" ? d.paymentLinkUrl : null,
  };
}

/** The user's deposits, newest first; the page is clamped to the last one. */
export async function userDeposits(userId: string, requestedPage: number) {
  const [{ total }] = await db.select({ total: count() }).from(deposits).where(eq(deposits.userId, userId));
  const pages = Math.max(1, Math.ceil(total / USER_DEPOSITS_PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const rows = await db
    .select(columns)
    .from(deposits)
    .where(eq(deposits.userId, userId))
    .orderBy(desc(deposits.createdAt))
    .limit(USER_DEPOSITS_PAGE_SIZE)
    .offset((page - 1) * USER_DEPOSITS_PAGE_SIZE);
  const now = new Date();
  return { deposits: rows.map((d) => toUserDeposit(d, now)), page, pages };
}

/** The deposit named in ?deposit= after Sumopod sends the user back; null unless it is this user's own. */
export async function userDepositById(userId: string, depositId: unknown): Promise<UserDeposit | null> {
  if (typeof depositId !== "string" || !UUID.test(depositId)) return null;
  const [row] = await db.select(columns).from(deposits).where(and(eq(deposits.id, depositId), eq(deposits.userId, userId)));
  return row ? toUserDeposit(row, new Date()) : null;
}
