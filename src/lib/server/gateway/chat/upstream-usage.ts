import "server-only";

// Reads usage from Surplus answers and removes what the user must not see (PRD gateway-api §1.3, §8, §9): the
// `surplus` object of long-running answers [S6] and every cost field inside `usage` (buyer_cost_micro is nbytes'
// purchase price [S6, S8]). Token counts stay, the user's SDK reads them.

export type UpstreamUsage = { inputTokens: number; outputTokens: number; costMicros: number | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null);
/** Documented as an integer [S6]; a digit string is accepted too, since Surplus field names do not fix the JSON type [S2]. */
const micros = (value: unknown) => (typeof value === "string" && /^\d{1,15}$/.test(value) ? Number(value) : count(value));

export function readUsage(body: unknown): UpstreamUsage | null {
  if (!isRecord(body) || !isRecord(body.usage)) return null;
  const inputTokens = count(body.usage.prompt_tokens);
  const outputTokens = count(body.usage.completion_tokens);
  if (inputTokens === null || outputTokens === null) return null;
  return { inputTokens, outputTokens, costMicros: micros(body.usage.buyer_cost_micro) };
}

/** Same object without Surplus cost and routing details (changed in place and returned). */
export function stripUpstream<T>(body: T): T {
  if (!isRecord(body)) return body;
  delete body.surplus;
  if (isRecord(body.usage)) for (const key of Object.keys(body.usage)) if (key.includes("cost")) delete body.usage[key];
  return body;
}

/**
 * Streaming (§8): SSE bytes pass through line by line; only a `data:` line that carries `usage` is parsed, read and
 * rewritten without cost fields. Comments (": ping") and every other line are forwarded unchanged.
 */
export class SseUsageTap {
  usage: UpstreamUsage | null = null;
  private rest = "";

  push(text: string): string {
    const lines = (this.rest + text).split("\n");
    this.rest = lines.pop() ?? "";
    return lines.map((line) => `${this.rewrite(line)}\n`).join("");
  }

  /** End of stream: whatever is left without a final newline. */
  flush(): string {
    const last = this.rest ? this.rewrite(this.rest) : "";
    this.rest = "";
    return last;
  }

  private rewrite(line: string): string {
    const cr = line.endsWith("\r") ? "\r" : "";
    const content = cr ? line.slice(0, -1) : line;
    if (!content.startsWith("data:") || !content.includes('"usage"')) return line;
    let event: unknown;
    try {
      event = JSON.parse(content.slice(5));
    } catch {
      return line;
    }
    const usage = readUsage(event);
    if (usage) this.usage = usage;
    return `data: ${JSON.stringify(stripUpstream(event))}${cr}`;
  }
}
