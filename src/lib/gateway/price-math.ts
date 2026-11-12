// Gateway price math (PRD gateway-pricing-billing §7, §9). Integer only: micro-USD (1 USD = 1_000_000), prices per
// 1M tokens, markup in basis points (100 = 1%). Sums use BigInt so tokens × price never loses precision.

const BP = 10_000;
const MICROS_PER_USD_PER_M = 12; // USD per token × 10^12 = micro-USD per 1M tokens
/** §9.1: the output Surplus itself assumes when max_tokens is not sent [S26]. */
export const DEFAULT_OUTPUT_TOKENS = 4096;
/** §9.1, owner 2026-11-12: input tokens are estimated as UTF-8 bytes of the request body ÷ 4, rounded up. */
export const BYTES_PER_INPUT_TOKEN = 4;
export const MAX_MARKUP_BP = 30_000; // 300%: anything above is almost certainly a typo (same bound as the admin page)
export const MIN_MARKUP_BP = -9_999; // a sell price of 0 or less is refused

export type TokenPrice = { inputMicros: number; outputMicros: number };

/** Surplus catalog price ("0.0000050000" USD per token) -> micro-USD per 1M tokens (5_000_000); null if not exact. */
export function usdPerTokenToMicrosPerM(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,6})(?:\.(\d{1,12}))?$/.exec(value);
  if (!match) return null;
  const micros = BigInt(match[1]) * BigInt(10) ** BigInt(MICROS_PER_USD_PER_M) + BigInt((match[2] ?? "").padEnd(12, "0"));
  return micros <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(micros) : null;
}

/** §7.1: sell = list × (1 + markup), rounded UP to a whole micro-dollar so rounding never eats the margin. */
export function applyMarkupMicros(listMicros: number, markupBp: number): number {
  const scaled = BigInt(listMicros) * BigInt(BP + markupBp);
  return Number((scaled + BigInt(BP - 1)) / BigInt(BP));
}

/**
 * §7.2: ceil((input × input price + output × output price) / 1M). Cache read/write are not priced apart yet: their
 * field names in the chat response are unproven (§7.2), so cached tokens stay inside input at the input price.
 */
export function chargeMicros(inputTokens: number, outputTokens: number, price: TokenPrice): number {
  const sum = BigInt(inputTokens) * BigInt(price.inputMicros) + BigInt(outputTokens) * BigInt(price.outputMicros);
  return Number((sum + BigInt(999_999)) / BigInt(1_000_000));
}

/** §9.1: output the request may produce: max_tokens from the user or 4096, capped at the model's own maximum. */
export function outputCap(requested: number | null, modelMax: number | null): number {
  const wanted = requested ?? DEFAULT_OUTPUT_TOKENS;
  return modelMax ? Math.min(wanted, modelMax) : wanted;
}

/** §9.1: what is held before calling Surplus. */
export function holdMicros(bodyBytes: number, maxOutputTokens: number, price: TokenPrice): number {
  return chargeMicros(Math.ceil(bodyBytes / BYTES_PER_INPUT_TOKEN), maxOutputTokens, price);
}
