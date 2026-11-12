import "server-only";
import { gatewayErrorStatus, mapUpstreamError } from "@/lib/gateway/error-contract";
import { chargeMicros, type TokenPrice } from "@/lib/gateway/price-math";
import { AppError } from "../../errors";
import { type Settlement, settleRequest } from "../request-billing";
import type { UpstreamUsage } from "./upstream-usage";

// What one finished Surplus call means for the bill (PRD gateway-api §7 step 9, §9; billing §7.4, §9).

export type CallContext = {
  requestId: string; price: TokenPrice; holdMicros: number; startedAt: number; surplusRequestId: string | null;
  /** x-si-provider-family and x-si-truncated of the answer; null until Surplus answered or when absent. */
  family: string | null; truncated: boolean | null;
};

const TELEMETRY_MAX = 100; // values come from Surplus: stored capped, never sent to the user

/** Reads the telemetry headers of a Surplus answer into the context (PRD admin-requests-upstream §5). */
export function readTelemetry(ctx: CallContext, headers: Headers): void {
  ctx.family = headers.get("x-si-provider-family")?.slice(0, TELEMETRY_MAX) || null;
  const truncated = headers.get("x-si-truncated");
  ctx.truncated = truncated === null ? null : truncated === "1";
}

/** §9.3/§9.5: real charge from usage; without usage the hold is charged and the cost marked for reconciliation. */
export function successSettlement(ctx: CallContext, usage: UpstreamUsage | null, headerCost: number | null): Settlement {
  return {
    state: "succeeded",
    chargeMicros: usage ? chargeMicros(usage.inputTokens, usage.outputTokens, ctx.price) : ctx.holdMicros,
    inputTokens: usage?.inputTokens ?? null,
    outputTokens: usage?.outputTokens ?? null,
    surplusRequestId: ctx.surplusRequestId,
    surplusCostMicros: usage?.costMicros ?? headerCost,
    statusCode: 200,
    errorCode: null,
    latencyMs: Date.now() - ctx.startedAt,
    upstreamFamily: ctx.family,
    truncated: ctx.truncated,
  };
}

/**
 * §7.4: a failed answer is not charged to the user. If Surplus still reports a cost it is stored as nbytes' loss.
 * Settles the request, then returns the AppError to answer with.
 */
export async function settleFailure(
  ctx: CallContext, status: number, upstreamCode: string | null, extra: { cost?: number | null; param?: unknown; retryAfter?: string | null } = {},
): Promise<AppError> {
  const mapped = mapUpstreamError(status, upstreamCode);
  // "Peringatan admin segera" (§9): no alert channel exists yet, so the server log carries it.
  if (mapped.alertAdmin) console.error(`[gateway] ADMIN ALERT: Surplus answered ${status} ${upstreamCode ?? "-"}`);
  await settleRequest(ctx.requestId, {
    state: "failed", chargeMicros: 0, inputTokens: null, outputTokens: null, surplusRequestId: ctx.surplusRequestId,
    surplusCostMicros: extra.cost ?? null, statusCode: status, errorCode: mapped.code, latencyMs: Date.now() - ctx.startedAt,
    upstreamErrorCode: upstreamCode?.slice(0, TELEMETRY_MAX) ?? null, upstreamFamily: ctx.family, truncated: ctx.truncated,
  });
  const param = mapped.code === "invalid_request" && typeof extra.param === "string" ? extra.param.slice(0, 100) : undefined;
  const retry = Number(extra.retryAfter);
  const retryAfter = mapped.code === "rate_limited" && Number.isInteger(retry) && retry > 0 ? retry : undefined;
  return new AppError(mapped.code, gatewayErrorStatus(mapped.code), param ? { param } : {}, retryAfter);
}
