import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { admins } from "./admin";
import { users } from "./auth";
import { gatewayRequests } from "./gateway";

// Balance and deposit tables (PRD gateway-pricing-billing §4, §5, §6, §8, §12). Money is integer only: rupiah
// (`*_idr`), micro-USD (`*_micros`, 1 USD = 1_000_000). Every time is timestamptz (UTC).
// Money records outlive the account: deleting a user sets user_id to NULL on deposits and the ledger (B6, saldo hangus);
// only the summary row in user_balances goes with the user.
const at = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => bigint(name, { mode: "number" });

/** §5: a new row per change, never updated; the newest row is the rate in force. */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    idrPerUsd: integer("idr_per_usd").notNull(),
    setBy: uuid("set_by").references(() => admins.id, { onDelete: "set null" }),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("exchange_rates_created_at_idx").on(t.createdAt),
    index("exchange_rates_set_by_idx").on(t.setBy),
    check("exchange_rates_positive_check", sql`${t.idrPerUsd} > 0`),
  ],
);

export const DEPOSIT_STATUSES = ["pending", "paid", "failed", "expired"] as const;

/** §6: one row per deposit request; the id is the Sumopod order_id. Rate and credit are locked at creation. */
export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    amountIdr: money("amount_idr").notNull(),
    feeIdr: money("fee_idr").notNull(),
    idrPerUsd: integer("idr_per_usd").notNull(),
    creditMicros: money("credit_micros").notNull(),
    status: text("status", { enum: DEPOSIT_STATUSES }).notNull().default("pending"),
    sumopodPaymentId: text("sumopod_payment_id"),
    paymentLinkUrl: text("payment_link_url"),
    paymentCode: text("payment_code"),
    paymentCodeType: text("payment_code_type"),
    paymentChannelUsed: text("payment_channel_used"),
    providerFeeIdr: money("provider_fee_idr"), // Sumopod fee, from the create response, then the webhook
    netAmountIdr: money("net_amount_idr"),
    paymentMethod: text("payment_method"),
    expiresAt: at("expires_at").notNull(),
    paidAt: at("paid_at"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("deposits_user_id_idx").on(t.userId),
    uniqueIndex("deposits_sumopod_payment_id_idx").on(t.sumopodPaymentId),
    check("deposits_status_check", sql`${t.status} in ('pending', 'paid', 'failed', 'expired')`),
    check("deposits_amounts_check", sql`${t.amountIdr} > 0 and ${t.feeIdr} >= 0 and ${t.creditMicros} >= 0`),
  ],
);

/** §6.3: every verified Sumopod delivery, keyed by svix-id so a replay of the same message does nothing. */
export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    svixId: text("svix_id").notNull(),
    eventType: text("event_type").notNull(),
    paymentId: text("payment_id"),
    // credited | status_updated | already_final | unknown_order | mismatch
    result: text("result").notNull(),
    receivedAt: at("received_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payment_webhook_events_svix_id_idx").on(t.svixId)],
);

export const LEDGER_KINDS = ["deposit", "hold", "hold_release", "usage", "adjustment", "refund"] as const;

/**
 * §8: append-only (the app only inserts). Signed amount: + adds, − takes. hold (−) and hold_release (+) move
 * user_balances.held_micros; every other kind moves balance_micros. So balance = sum of non-hold rows, and
 * held = −(sum of hold + hold_release rows).
 */
export const balanceLedger = pgTable(
  "balance_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind", { enum: LEDGER_KINDS }).notNull(),
    amountMicros: money("amount_micros").notNull(),
    depositId: uuid("deposit_id").references(() => deposits.id, { onDelete: "restrict" }),
    // hold, hold_release and usage rows of one gateway request (gateway-api §7).
    requestId: uuid("request_id").references(() => gatewayRequests.id, { onDelete: "restrict" }),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("balance_ledger_user_id_idx").on(t.userId),
    index("balance_ledger_request_id_idx").on(t.requestId),
    // One credit per deposit, enforced by the database as well as the webhook handler.
    uniqueIndex("balance_ledger_deposit_credit_idx").on(t.depositId).where(sql`${t.kind} = 'deposit'`),
    check(
      "balance_ledger_kind_check",
      sql`${t.kind} in ('deposit', 'hold', 'hold_release', 'usage', 'adjustment', 'refund')`,
    ),
  ],
);

/** §8: summary per user, changed only in the same transaction as its ledger row. */
export const userBalances = pgTable("user_balances", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balanceMicros: money("balance_micros").notNull().default(0),
  heldMicros: money("held_micros").notNull().default(0),
  updatedAt: at("updated_at").notNull().defaultNow(),
});
