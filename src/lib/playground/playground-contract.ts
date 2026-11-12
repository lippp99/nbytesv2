// Body of POST /api/playground/chat (PRD dashboard-playground §5.1). Only these fields are accepted: the server adds
// `stream: true` itself, so routing fields or anything else a page could slip in never reach Surplus.

/** P4: enough for a long text conversation; checked before parsing. */
export const PLAYGROUND_MAX_BODY_BYTES = 256 * 1024;
/** Proposed bound (PRD §5.1): a conversation longer than this has to be cleared first. */
export const PLAYGROUND_MAX_MESSAGES = 200;
const MAX_MODEL_ID = 200;
const ROLES = ["system", "user", "assistant"] as const;

export type PlaygroundMessage = { role: (typeof ROLES)[number]; content: string };
export type PlaygroundBody = { model: string; messages: PlaygroundMessage[]; temperature: number; max_tokens: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((k) => keys.includes(k));

function isMessage(value: unknown): value is PlaygroundMessage {
  return isRecord(value) && onlyKeys(value, ["role", "content"]) && ROLES.includes(value.role as PlaygroundMessage["role"])
    && typeof value.content === "string";
}

/** The body, or null for anything else: unknown fields, roles, non-text content, temperature outside 0–2. */
export function parsePlaygroundBody(json: unknown): PlaygroundBody | null {
  if (!isRecord(json) || !onlyKeys(json, ["model", "messages", "temperature", "max_tokens"])) return null;
  const { model, messages, temperature, max_tokens: maxTokens } = json;
  if (typeof model !== "string" || !model || model.length > MAX_MODEL_ID) return null;
  if (!Array.isArray(messages) || !messages.length || messages.length > PLAYGROUND_MAX_MESSAGES) return null;
  if (!messages.every(isMessage)) return null;
  if (typeof temperature !== "number" || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) return null;
  if (typeof maxTokens !== "number" || !Number.isSafeInteger(maxTokens) || maxTokens < 1) return null;
  return { model, messages, temperature, max_tokens: maxTokens };
}
