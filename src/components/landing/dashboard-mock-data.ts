// Mock numbers for the product dashboard and feature cards on the landing page. Examples only.

export type LogEntry = { id: number; time: string; status: number; retried?: boolean; modelId: string; tag: string; costMicros: number };

export const mockStats = [
  { key: "bill", label: "Tagihan · November", value: 182_400_000, unit: "usd", sub: "Paket Pro" },
  { key: "tokens", label: "Token", value: 48_200_000, unit: "compact", sub: "di 12 model" },
  { key: "requests", label: "Request", value: 1_213_408, unit: "count", sub: "41 error · 0,003%", subTone: "bad" },
  { key: "latency", label: "Latensi p50", value: 211, unit: "latency", sub: "p95 1,2 s" },
] as const;

export const mockUsage = [
  { modelId: "claude-sonnet-4.5", requests: 588_204, costMicros: 96_400_000 },
  { modelId: "gpt-5", requests: 402_117, costMicros: 61_300_000 },
  { modelId: "gemini-2.5-pro", requests: 141_920, costMicros: 18_200_000 },
  { modelId: "deepseek-v3.2", requests: 61_082, costMicros: 4_100_000 },
  { modelId: "kimi-k2", requests: 20_085, costMicros: 2_400_000 },
];

/** Rows the live log cycles through; times are generated on the client. */
export const mockLogPool: Omit<LogEntry, "id" | "time">[] = [
  { status: 200, modelId: "claude-sonnet-4.5", tag: "support", costMicros: 10_200 },
  { status: 200, modelId: "gpt-5-mini", tag: "triage", costMicros: 900 },
  { status: 200, retried: true, modelId: "gpt-5", tag: "riset", costMicros: 21_700 },
  { status: 200, modelId: "deepseek-v3.2", tag: "coding", costMicros: 1_800 },
  { status: 200, modelId: "gemini-2.5-pro", tag: "ringkas", costMicros: 7_400 },
  { status: 400, modelId: "qwen3-max", tag: "ekstrak", costMicros: 0 },
  { status: 200, modelId: "kimi-k2", tag: "coding", costMicros: 3_600 },
  { status: 200, modelId: "glm-4.6", tag: "support", costMicros: 2_900 },
];

/** Initial rows rendered on the server so the log is never empty. */
export const mockLogSeed: LogEntry[] = mockLogPool.slice(0, 7).map((row, i) => ({
  ...row,
  id: i,
  time: `14:02:${String(45 - i * 3).padStart(2, "0")}`,
}));

export const mockTags = [
  { customer: "acct_1042", requests: 412_880, costMicros: 38_100_000 },
  { customer: "acct_2210", requests: 208_114, costMicros: 19_400_000 },
  { customer: "acct_0387", requests: 96_402, costMicros: 8_800_000 },
];

export const mockFallback = [
  { provider: "anthropic", status: 429, note: "Batas rate" },
  { provider: "openai", status: 200, note: "1.104 ms" },
];

export const mockBudget = [
  { keyName: "produksi", usedMicros: 412_300_000, limitMicros: 500_000_000 },
  { keyName: "staging", usedMicros: 38_900_000, limitMicros: 100_000_000 },
  { keyName: "eksperimen", usedMicros: 9_400_000, limitMicros: 50_000_000 },
];
