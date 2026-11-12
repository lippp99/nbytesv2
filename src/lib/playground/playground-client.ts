import type { PlaygroundBody } from "./playground-contract";
import { type TokenUsage, readEvent, splitSse } from "./sse-reader";

// Playground call (POST /api/playground/chat, streamed). Components use this, never raw fetch.

export type PlaygroundError =
  | { kind: "offline" }
  | { kind: "unauthorized" }
  | { kind: "insufficient_balance" }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "model_not_found" }
  | { kind: "invalid_request" }
  | { kind: "unavailable" };

/** stopped: the user aborted; the server still finishes the answer and charges its real usage (P3 c). */
export type StreamResult = { ok: true; usage: TokenUsage | null; stopped: boolean } | { ok: false; error: PlaygroundError };

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

async function errorOf(response: Response): Promise<PlaygroundError> {
  const code = (await response.json().catch(() => null))?.error?.code;
  if (code === "rate_limited") return { kind: code, retryAfterSeconds: Math.max(1, Number(response.headers.get("retry-after")) || 1) };
  if (code === "unauthorized" || code === "insufficient_balance") return { kind: code };
  if (code === "invalid_request" || code === "request_too_large") return { kind: "invalid_request" };
  if (code === "model_not_found" || code === "model_unavailable") return { kind: "model_not_found" };
  return { kind: "unavailable" };
}

/** Streams one answer, calling onDelta for each piece of text as it arrives. */
export async function streamChat(
  body: PlaygroundBody, signal: AbortSignal, onDelta: (text: string) => void,
): Promise<StreamResult> {
  let response: Response;
  try {
    response = await fetch("/api/playground/chat", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal,
    });
  } catch {
    if (signal.aborted) return { ok: true, usage: null, stopped: true };
    return { ok: false, error: { kind: isOffline() ? "offline" : "unavailable" } };
  }
  if (!response.ok || !response.body || !(response.headers.get("content-type") ?? "").includes("text/event-stream")) {
    return { ok: false, error: await errorOf(response) };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let rest = "";
  let usage: TokenUsage | null = null;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      const split = splitSse(rest + decoder.decode(chunk.value, { stream: true }));
      rest = split.rest;
      for (const data of split.data) {
        const event = readEvent(data);
        if (event.error) return { ok: false, error: { kind: "unavailable" } };
        if (event.delta) onDelta(event.delta);
        if (event.usage) usage = event.usage;
      }
    }
  } catch {
    if (signal.aborted) return { ok: true, usage: null, stopped: true };
    return { ok: false, error: { kind: "unavailable" } };
  }
  return { ok: true, usage, stopped: false };
}
