import type { PlaygroundBody, PlaygroundMessage } from "@/lib/playground/playground-contract";

export type RequestMessage = PlaygroundMessage;
export type RequestParams = { model: string; temperature: number; maxTokens: number };

/** Messages sent to the API: the system prompt (if any) first, then the conversation in order. */
export function buildMessages(system: string, history: RequestMessage[]): RequestMessage[] {
  const head: RequestMessage[] = system.trim() ? [{ role: "system", content: system.trim() }] : [];
  return [...head, ...history];
}

/** OpenAI-compatible chat completions body, with the playground's parameters (also the Playground endpoint's body). */
export function requestBody(params: RequestParams, messages: RequestMessage[]): PlaygroundBody {
  return { model: params.model, messages, temperature: params.temperature, max_tokens: params.maxTokens };
}

/** Bytes of the JSON the server will read: the hold estimate counts input from these (billing §9.1). */
export const bodyBytes = (body: object) => new TextEncoder().encode(JSON.stringify(body)).length;

/** The same request as a cURL command; single quotes in the JSON are escaped for the shell. */
export function curlCommand(baseUrl: string, body: object): string {
  const json = JSON.stringify(body, null, 2).replace(/'/g, "'\\''");
  return `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $NBYTES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${json}'`;
}

// shortcut: ~4 characters per token, the usual rough rule for English-like text; only the composer's estimate uses it,
// replies show the token counts the API returns.
export function estimateTokens(text: string): number {
  return text.trim() ? Math.max(1, Math.ceil(text.trim().length / 4)) : 0;
}

/** A typed parameter brought into its allowed range and precision (0.1 for temperature, whole tokens); null if not a number. */
export function clampParam(value: number, min: number, max: number, decimals = 0): number | null {
  if (!Number.isFinite(value)) return null;
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(value * f) / f));
}
