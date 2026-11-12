// Body of POST /api/v1/chat/completions (PRD gateway-api §7 steps 4–5). Only what nbytes needs is checked; every other
// field passes through as is (Surplus applies its own deny-list [S11]).

/** §7.1: same JSON limit as Surplus [S25]. */
export const MAX_JSON_BODY_BYTES = 10 * 1024 * 1024;
const MAX_MODEL_ID = 200;

/** §7.5 (A2): routing and cost are controlled by nbytes, so these never reach Surplus from a user. */
export const ROUTING_FIELDS = [
  "provider", "provider_url", "provider_base_url", "providers_blocked", "provider_order", "si_route", "min_discount_pct",
] as const;

export type ChatRequest = {
  model: string;
  stream: boolean;
  /** max_completion_tokens, else max_tokens, else null. */
  maxTokens: number | null;
  hasImage: boolean;
  /** What is sent to Surplus: the user's body minus routing fields, plus include_usage when streaming (§8). */
  upstreamBody: Record<string, unknown>;
};

export type ChatParse = { ok: true; value: ChatRequest } | { ok: false; param: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isPositiveInt = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function hasImagePart(messages: unknown[]): boolean {
  return messages.some(
    (m) => isRecord(m) && Array.isArray(m.content) && m.content.some((part) => isRecord(part) && part.type === "image_url"),
  );
}

export function parseChatBody(json: unknown): ChatParse {
  if (!isRecord(json)) return { ok: false, param: null };
  const { model, messages, stream } = json;
  if (typeof model !== "string" || !model || model.length > MAX_MODEL_ID) return { ok: false, param: "model" };
  if (!Array.isArray(messages) || !messages.length || !messages.every(isRecord)) return { ok: false, param: "messages" };
  if (stream !== undefined && typeof stream !== "boolean") return { ok: false, param: "stream" };
  for (const field of ["max_tokens", "max_completion_tokens"]) {
    if (json[field] !== undefined && json[field] !== null && !isPositiveInt(json[field])) return { ok: false, param: field };
  }
  if (json.stream_options !== undefined && !isRecord(json.stream_options)) return { ok: false, param: "stream_options" };

  const upstreamBody: Record<string, unknown> = { ...json };
  for (const field of ROUTING_FIELDS) delete upstreamBody[field];
  if (stream) upstreamBody.stream_options = { ...(json.stream_options as object | undefined), include_usage: true };
  const maxTokens = (json.max_completion_tokens ?? json.max_tokens ?? null) as number | null;
  return { ok: true, value: { model, stream: stream === true, maxTokens, hasImage: hasImagePart(messages), upstreamBody } };
}
