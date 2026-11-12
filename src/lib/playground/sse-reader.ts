// Reads the OpenAI-style chat stream the Playground receives (PRD dashboard-playground §5.3). Pure: no fetch here.

export type TokenUsage = { input: number; output: number };
export type StreamEvent = { delta?: string; usage?: TokenUsage; error?: true; done?: true };

/** Splits received text into complete `data:` payloads; the unfinished last line is kept for the next chunk. */
export function splitSse(buffer: string): { data: string[]; rest: string } {
  const lines = buffer.split(/\r?\n/);
  const rest = lines.pop() ?? "";
  const data = lines.filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
  return { data, rest };
}

const count = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null);

/** One payload: text delta, usage (last event when include_usage is on), an error event, or [DONE]. */
export function readEvent(data: string): StreamEvent {
  if (data === "[DONE]") return { done: true };
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return {};
  }
  if (!json || typeof json !== "object") return {};
  if (json.error) return { error: true };
  const event: StreamEvent = {};
  const choice = Array.isArray(json.choices) ? (json.choices[0] as { delta?: { content?: unknown } } | undefined) : undefined;
  if (typeof choice?.delta?.content === "string" && choice.delta.content) event.delta = choice.delta.content;
  const usage = json.usage as { prompt_tokens?: unknown; completion_tokens?: unknown } | null | undefined;
  const input = count(usage?.prompt_tokens);
  const output = count(usage?.completion_tokens);
  if (input !== null && output !== null) event.usage = { input, output };
  return event;
}
