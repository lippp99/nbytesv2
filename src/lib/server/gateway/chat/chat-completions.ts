import "server-only";
import { MAX_JSON_BODY_BYTES, type ChatRequest, parseChatBody } from "@/lib/gateway/chat-contract";
import { holdMicros, outputCap } from "@/lib/gateway/price-math";
import { logServerError } from "../../auth/request-guard";
import { AppError } from "../../errors";
import { activeModel } from "../catalog";
import { authenticatePublic, gatewayErrorResponse, gatewayJson, newRequestId, readPublicJson } from "../public-api";
import { holdForRequest, settleRequest } from "../request-billing";
import { streamThrough } from "./stream-proxy";
import { postSurplus } from "../surplus-client";
import { type CallContext, readTelemetry, settleFailure, successSettlement } from "./upstream-outcome";
import { readUsage, stripUpstream } from "./upstream-usage";

// POST /api/v1/chat/completions (PRD gateway-api §7): key -> rate limit -> validate -> catalog -> hold -> Surplus ->
// settle -> answer. Prompts and answers are never stored (§12). The Playground (PRD dashboard-playground §5.1) enters
// through its own guard and shares everything from the catalog check on (runChat).

const ENDPOINT = "/v1/chat/completions";

/** Who pays and how the call behaves; /api/v1 and the Playground differ only here. */
export type ChatCaller = {
  userId: string;
  /** null: the Playground, which has no key and so no key budget. */
  keyId: string | null;
  monthlyBudgetMicros: number | null;
  endpoint: string;
  /** P3 (c): stopping does not cancel the model; the answer is read to the end and its real usage charged. */
  finishOnDisconnect: boolean;
};
export type PreparedChat = { caller: ChatCaller; chat: ChatRequest; bytes: number };

export function chatCompletions(request: Request): Promise<Response> {
  return runChat(request, async () => {
    const owner = await authenticatePublic(request);
    const { json, bytes } = await readPublicJson(request, MAX_JSON_BODY_BYTES);
    return { caller: { ...owner, endpoint: ENDPOINT, finishOnDisconnect: false }, chat: parseChatRequest(json), bytes };
  });
}

/** §7 steps 4–10 for an already guarded caller; any error before or after the hold becomes the gateway envelope. */
export async function runChat(request: Request, prepare: () => Promise<PreparedChat>): Promise<Response> {
  let requestId = newRequestId();
  let ctx: CallContext | null = null;
  try {
    const { caller, chat, bytes } = await prepare();
    const model = await activeModel(chat.model);
    if (!model) throw new AppError("model_not_found", 404, { param: "model" });
    // §7.6: images to a model without image input are refused before any cost.
    if (chat.hasImage && !model.supportsImages) throw new AppError("invalid_request", 400, { param: "messages" });

    const price = { inputMicros: model.inputMicros, outputMicros: model.outputMicros };
    const hold = holdMicros(bytes, outputCap(chat.maxTokens, model.maxCompletionTokens), price);
    requestId = await holdForRequest({
      userId: caller.userId, keyId: caller.keyId, monthlyBudgetMicros: caller.monthlyBudgetMicros,
      modelId: model.modelId, endpoint: caller.endpoint, stream: chat.stream, holdMicros: hold,
    });
    ctx = { requestId, price, holdMicros: hold, startedAt: Date.now(), surplusRequestId: null, family: null, truncated: null };
    return await callSurplus(request, chat, ctx, caller.finishOnDisconnect);
  } catch (error) {
    // Anything unexpected after the hold (e.g. the answer body broke off) still releases it; a no-op if already settled.
    if (ctx) await settleRequest(ctx.requestId, unknownFailure(ctx)).catch(logServerError);
    return gatewayErrorResponse(error, requestId);
  }
}

/** Not charged to the user; Surplus cost unknown, so the row is marked for reconciliation. */
const unknownFailure = (ctx: CallContext) => ({
  state: "failed" as const, chargeMicros: 0, inputTokens: null, outputTokens: null, surplusRequestId: ctx.surplusRequestId,
  surplusCostMicros: null, statusCode: 503, errorCode: "service_unavailable", latencyMs: Date.now() - ctx.startedAt,
  upstreamFamily: ctx.family, truncated: ctx.truncated,
});

export function parseChatRequest(json: unknown): ChatRequest {
  const parsed = parseChatBody(json);
  if (!parsed.ok) throw new AppError("invalid_request", 400, parsed.param ? { param: parsed.param } : {});
  return parsed.value;
}

async function callSurplus(request: Request, chat: ChatRequest, ctx: CallContext, finishOnDisconnect: boolean): Promise<Response> {
  let upstream: Response;
  // finishOnDisconnect: the user's disconnect must not reach Surplus, so the call gets a signal that never aborts.
  const signal = finishOnDisconnect ? new AbortController().signal : request.signal;
  try {
    upstream = await postSurplus(ENDPOINT, chat.upstreamBody, signal);
  } catch (error) {
    console.error("[gateway] Surplus unreachable:", error instanceof Error ? error.name : "unknown");
    throw await settleFailure(ctx, 502, null);
  }
  ctx.surplusRequestId = upstream.headers.get("x-request-id")?.slice(0, 200) ?? null;
  readTelemetry(ctx, upstream.headers);
  const isStream = (upstream.headers.get("content-type") ?? "").includes("text/event-stream");
  if (chat.stream && upstream.ok && isStream && upstream.body) return streamThrough(upstream, ctx, request.signal, finishOnDisconnect);
  return finishJson(upstream, ctx);
}

/** Non-streaming: judged by the body, not the status alone (a long request answers 200 even when it failed [S6]). */
async function finishJson(upstream: Response, ctx: CallContext): Promise<Response> {
  const text = await upstream.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {}
  const usage = readUsage(body);
  const headerCost = /^\d{1,15}$/.test(upstream.headers.get("x-si-buyer-cost-micro") ?? "")
    ? Number(upstream.headers.get("x-si-buyer-cost-micro"))
    : null;
  const error = body && typeof body.error === "object" && body.error ? (body.error as Record<string, unknown>) : null;
  if (!upstream.ok || !body || error || !Array.isArray(body.choices)) {
    const code = typeof error?.code === "string" ? error.code : null;
    throw await settleFailure(ctx, upstream.status, code, {
      cost: usage?.costMicros ?? headerCost, param: error?.param, retryAfter: upstream.headers.get("retry-after"),
    });
  }
  await settleRequest(ctx.requestId, successSettlement(ctx, usage, headerCost));
  return gatewayJson(stripUpstream(body), 200, ctx.requestId);
}
