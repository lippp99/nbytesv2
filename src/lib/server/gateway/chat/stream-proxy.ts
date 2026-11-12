import "server-only";
import { logServerError } from "../../auth/request-guard";
import { settleRequest } from "../request-billing";
import { type CallContext, successSettlement } from "./upstream-outcome";
import { SseUsageTap } from "./upstream-usage";

// Streaming answer (PRD gateway-api §8): Surplus SSE bytes go to the user as they arrive; the usage event is read on
// the way (and cleaned of cost). The bill is settled exactly once: at the end, on an upstream error, or when the user
// disconnects. No usage by then -> the hold is charged and the cost marked pending (billing §9.5).

type End = "done" | "upstream_error" | "client_disconnected";

/**
 * `userSignal` is the user's request: aborted means they disconnected, anything else is an upstream failure.
 * `finishOnDisconnect` (Playground, P3 c): a disconnect keeps reading Surplus to the end and charges the real usage.
 */
export function streamThrough(upstream: Response, ctx: CallContext, userSignal: AbortSignal, finishOnDisconnect = false): Response {
  const reader = upstream.body!.getReader();
  const tap = new SseUsageTap();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let settled = false;
  // Set once a stopped Playground answer is being read to the end: a pull still in flight must not settle it as failed.
  let draining = false;

  async function settle(end: End) {
    if (settled) return;
    settled = true;
    const settlement = successSettlement(ctx, tap.usage, null);
    if (end !== "done") Object.assign(settlement, { state: "failed", errorCode: end });
    await settleRequest(ctx.requestId, settlement).catch(logServerError);
  }

  /** The rest of the answer, read only for its usage event; nothing is sent anywhere. */
  async function drainToEnd() {
    try {
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        tap.push(decoder.decode(chunk.value, { stream: true }));
      }
      tap.push(decoder.decode());
      tap.flush();
      await settle("done");
    } catch {
      await settle("upstream_error");
    }
  }

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (!done) {
          const out = tap.push(decoder.decode(value, { stream: true }));
          if (out) controller.enqueue(encoder.encode(out));
          return;
        }
        const rest = tap.push(decoder.decode()) + tap.flush();
        if (rest) controller.enqueue(encoder.encode(rest));
        await settle("done");
        controller.close();
      } catch (error) {
        if (draining) return;
        // The user's disconnect aborts the Surplus fetch too (same signal), which lands here as a failed read.
        await settle(userSignal.aborted ? "client_disconnected" : "upstream_error");
        controller.error(error);
      }
    },
    async cancel() {
      if (finishOnDisconnect) {
        // shortcut: runs on after the response closed; fine on a long-lived Node server, a serverless host may stop it
        // early (A6 open). Then the row stays pending with its hold until reconciliation.
        draining = true;
        void drainToEnd();
        return;
      }
      await reader.cancel().catch(() => {});
      await settle("client_disconnected");
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "x-request-id": ctx.requestId,
    },
  });
}
