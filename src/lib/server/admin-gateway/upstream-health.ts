import "server-only";
import { and, desc, eq, gte, max, sql } from "drizzle-orm";
import {
  type AttentionItem, type ModelHealth, type SurplusBalance, type UpstreamHealth, parseSurplusBalance,
} from "@/lib/admin-gateway/upstream-contract";
import { logServerError } from "../auth/request-guard";
import { db } from "../db/client";
import { gatewayRequests, modelPrices } from "../db/schema";
import { fetchSurplusBalance } from "../gateway/surplus-client";

// Admin Upstream page (PRD admin-requests-upstream §4): Surplus balance plus health from nbytes' own requests.

const WINDOW_HOURS = 24;
const g = gatewayRequests;
const int = (expr: ReturnType<typeof sql>) => sql<number>`${expr}`.mapWith(Number);

/** R4: read on every page view; null (and logged) when Surplus does not answer or the shape is unexpected. */
export async function surplusBalance(): Promise<SurplusBalance | null> {
  try {
    const balance = parseSurplusBalance(await fetchSurplusBalance());
    if (!balance) throw new Error("Surplus balance: unexpected body");
    return balance;
  } catch (error) {
    logServerError(error);
    return null;
  }
}

async function modelHealth(since: Date): Promise<ModelHealth[]> {
  const rows = await db
    .select({
      modelId: g.modelId,
      active: sql<boolean>`coalesce(bool_or(${modelPrices.active}), false)`,
      requests: int(sql`count(*)`),
      failed: int(sql`count(*) filter (where ${g.state} = 'failed')`),
      unavailable: int(sql`count(*) filter (where ${g.errorCode} = 'model_unavailable')`),
      p50LatencyMs: sql<number | null>`percentile_disc(0.5) within group (order by ${g.latencyMs})`.mapWith((v) => (v === null ? null : Number(v))),
      costPending: int(sql`count(*) filter (where ${g.costStatus} = 'pending')`),
      negativeMargin: int(sql`count(*) filter (where ${g.chargeMicros} < ${g.surplusCostMicros})`),
    })
    .from(g)
    .leftJoin(modelPrices, eq(modelPrices.modelId, g.modelId))
    .where(gte(g.createdAt, since))
    .groupBy(g.modelId)
    .orderBy(desc(sql`count(*)`));
  // Active models without a request in the window still belong on the page, with zeros.
  const active = await db.select({ modelId: modelPrices.modelId }).from(modelPrices).where(eq(modelPrices.active, true));
  const seen = new Set(rows.map((r) => r.modelId));
  const idle = active.filter((m) => !seen.has(m.modelId)).map((m) => ({
    modelId: m.modelId, active: true, requests: 0, failed: 0, unavailable: 0, p50LatencyMs: null, costPending: 0, negativeMargin: 0,
  }));
  return [...rows, ...idle];
}

/** Failures that point at nbytes' Surplus key, credit or budget (mapped to service_unavailable, gateway-api §9). */
async function attention(since: Date): Promise<AttentionItem[]> {
  const rows = await db
    .select({
      upstreamErrorCode: g.upstreamErrorCode, statusCode: g.statusCode, count: int(sql`count(*)`), lastAt: max(g.createdAt),
    })
    .from(g)
    .where(and(gte(g.createdAt, since), eq(g.errorCode, "service_unavailable")))
    .groupBy(g.upstreamErrorCode, g.statusCode)
    .orderBy(desc(max(g.createdAt)));
  return rows.map((r) => ({ ...r, lastAt: (r.lastAt ?? since).toISOString() }));
}

export async function upstreamHealth(): Promise<UpstreamHealth> {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
  const [balance, models, items] = await Promise.all([surplusBalance(), modelHealth(since), attention(since)]);
  return { balance, windowHours: WINDOW_HOURS, models, attention: items };
}
