import type { Model } from "@/lib/model-catalog";

// shortcut: ~4 characters per token, the usual rough rule for English-like text; replace with the usage numbers the
// API returns once the playground calls the real backend.
export function estimateTokens(text: string): number {
  return text.trim() ? Math.max(1, Math.ceil(text.trim().length / 4)) : 0;
}

/** Cost of one call in integer micro-dollars; prices are micro-dollars per 1M tokens. */
export function callCostMicros(model: Model, inputTokens: number, outputTokens: number): number {
  return Math.round((inputTokens * model.inputPerMTokMicros + outputTokens * model.outputPerMTokMicros) / 1_000_000);
}
