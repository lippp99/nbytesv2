import "server-only";
import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { type MoneyHealth, type OverviewAlert, buildAlerts } from "@/lib/admin-overview-contract";
import { db } from "../db/client";
import { adminAuditEvents, gatewayRequests, paymentWebhookEvents } from "../db/schema";

// Alerts of the admin overview (PRD admin-overview §3.5), computed when the page opens. The money facts come from
// moneyHealth() so Surplus is read once per page.

const g = gatewayRequests;
const HOUR_MS = 3_600_000;
const num = (expr: ReturnType<typeof sql>) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);

export async function overviewAlerts(now: Date, money: MoneyHealth): Promise<OverviewAlert[]> {
  const day = new Date(now.getTime() - 24 * HOUR_MS);
  const week = new Date(now.getTime() - 7 * 24 * HOUR_MS);
  const [[requests], [oldPending], [webhooks], admin] = await Promise.all([
    db
      .select({
        serviceUnavailable24h: num(sql`count(*) filter (where ${g.errorCode} = 'service_unavailable')`),
        negativeMargin24h: num(sql`count(*) filter (where ${g.chargeMicros} < ${g.surplusCostMicros})`),
      })
      .from(g)
      .where(gte(g.createdAt, day)),
    db.select({ costPendingOld: count() }).from(g).where(and(eq(g.costStatus, "pending"), lt(g.createdAt, day))),
    db
      .select({ webhookMismatch7d: count() })
      .from(paymentWebhookEvents)
      .where(and(inArray(paymentWebhookEvents.result, ["mismatch", "unknown_order"]), gte(paymentWebhookEvents.receivedAt, week))),
    db
      .select({ type: adminAuditEvents.type, n: count() })
      .from(adminAuditEvents)
      .where(and(inArray(adminAuditEvents.type, ["locked", "totp_failed"]), gte(adminAuditEvents.createdAt, day)))
      .groupBy(adminAuditEvents.type),
  ]);
  const admins = (type: string) => admin.find((a) => a.type === type)?.n ?? 0;
  return buildAlerts({
    surplusUnreadable: money.surplus === null,
    coverageLow: money.surplus !== null && money.surplus.creditMicros < money.userBalanceMicros,
    ...requests,
    ...oldPending,
    depositsStuck: money.depositsStuck,
    ...webhooks,
    noExchangeRate: money.idrPerUsd === null,
    adminLocked24h: admins("locked"),
    totpFailed24h: admins("totp_failed"),
    negativeBalances: money.negativeBalances,
  });
}
