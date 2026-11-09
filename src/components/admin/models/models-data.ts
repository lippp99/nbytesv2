// Mock upstream prices (what nbytes pays each provider per 1M tokens, after negotiated discounts). Admin-only.
// The user-facing sell price stays in lib/model-catalog.ts. Every number is an example, integer micro-dollars.
export type UpstreamCost = { modelId: string; inMicros: number; outMicros: number };

export const upstreamCosts: UpstreamCost[] = [
  { modelId: "gpt-5", inMicros: 1_125_000, outMicros: 9_000_000 },
  { modelId: "gpt-5-mini", inMicros: 225_000, outMicros: 1_800_000 },
  { modelId: "claude-sonnet-4.5", inMicros: 2_700_000, outMicros: 13_500_000 },
  { modelId: "claude-haiku-4.5", inMicros: 900_000, outMicros: 4_500_000 },
  { modelId: "gemini-2.5-pro", inMicros: 1_100_000, outMicros: 8_800_000 },
  { modelId: "llama-4-maverick", inMicros: 200_000, outMicros: 600_000 },
  { modelId: "mistral-medium-3", inMicros: 340_000, outMicros: 1_700_000 },
  { modelId: "deepseek-v3.2", inMicros: 230_000, outMicros: 350_000 },
  { modelId: "qwen3-max", inMicros: 1_000_000, outMicros: 5_000_000 },
  { modelId: "kimi-k2", inMicros: 500_000, outMicros: 2_000_000 },
  { modelId: "glm-4.6", inMicros: 480_000, outMicros: 1_800_000 },
  { modelId: "grok-4", inMicros: 2_700_000, outMicros: 13_500_000 },
];

/** Fee on every credit top-up, in basis points (500 = 5%), and the card processor's cut it has to cover. */
export const defaultTopUpFeeBp = 500;
export const paymentFeeBp = 290;
