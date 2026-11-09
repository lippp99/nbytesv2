// Gateway margin math, integer only (micro-dollars and basis points), PRD admin-console §3.2.
const BP = 10_000; // 100% in basis points
const CENT = 10_000; // micro-dollars in one cent
const MAX_MARKUP_BP = 30_000; // 300%: anything above is almost certainly a typo

/** Sell price per 1M tokens: cost plus markup, rounded UP to a whole cent so rounding never eats the margin. */
export function applyMarkup(costMicros: number, markupBp: number): number {
  return Math.ceil((costMicros * (BP + markupBp)) / (BP * CENT)) * CENT;
}

/** Markup = profit / cost (what the admin sets). 9 -> 10 is a 11.1% markup. */
export function markupBpOf(costMicros: number, sellMicros: number): number {
  return costMicros > 0 ? Math.round(((sellMicros - costMicros) * BP) / costMicros) : 0;
}

/** Gross margin = profit / sell price (what finance reports). 9 -> 10 is a 10% margin. */
export function marginBpOf(costMicros: number, sellMicros: number): number {
  return sellMicros > 0 ? Math.round(((sellMicros - costMicros) * BP) / sellMicros) : 0;
}

/** Price of `tokens` at a per-1M-token rate, in micro-dollars. */
export function tokensMicros(perMTokMicros: number, tokens: number): number {
  return Math.round((perMTokMicros * tokens) / 1_000_000);
}

/** "12" / "12.5" / "12,5" -> 1250 bp; null when empty, not a number, or over 300%. */
export function parsePercentToBp(input: string): number | null {
  const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const bp = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return bp <= MAX_MARKUP_BP ? bp : null;
}

/** 1250 -> "12.5%", 1000 -> "10%" */
export function formatBp(bp: number): string {
  return `${(bp / 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}
