// Mock request log for the admin. Every row is an example; money in integer micro-dollars, times in UTC.
export type RequestRow = {
  id: string;
  at: string;
  user: string;
  modelId: string;
  status: number;
  latencyMs: number;
  tokens: number;
  costMicros: number;
};

export const requestRows: RequestRow[] = [
  { id: "req_9f2a", at: "2026-11-08T09:14:22Z", user: "rina@kopikode.example", modelId: "claude-sonnet-4.5", status: 200, latencyMs: 1_204, tokens: 3_812, costMicros: 41_300 },
  { id: "req_9f29", at: "2026-11-08T09:14:19Z", user: "ops@lumbung.example", modelId: "gpt-5", status: 200, latencyMs: 842, tokens: 1_990, costMicros: 15_600 },
  { id: "req_9f28", at: "2026-11-08T09:14:11Z", user: "dev@arunika.example", modelId: "grok-4", status: 503, latencyMs: 30_000, tokens: 0, costMicros: 0 },
  { id: "req_9f27", at: "2026-11-08T09:14:02Z", user: "budi@toko.example", modelId: "deepseek-v3.2", status: 200, latencyMs: 512, tokens: 6_204, costMicros: 2_100 },
  { id: "req_9f26", at: "2026-11-08T09:13:58Z", user: "rina@kopikode.example", modelId: "gemini-2.5-pro", status: 429, latencyMs: 38, tokens: 0, costMicros: 0 },
  { id: "req_9f25", at: "2026-11-08T09:13:41Z", user: "ai@sekolahku.example", modelId: "gpt-5-mini", status: 200, latencyMs: 402, tokens: 890, costMicros: 1_200 },
  { id: "req_9f24", at: "2026-11-08T09:13:30Z", user: "ops@lumbung.example", modelId: "claude-haiku-4.5", status: 200, latencyMs: 611, tokens: 2_406, costMicros: 6_800 },
  { id: "req_9f23", at: "2026-11-08T09:13:12Z", user: "dev@arunika.example", modelId: "kimi-k2", status: 400, latencyMs: 91, tokens: 0, costMicros: 0 },
  { id: "req_9f22", at: "2026-11-08T09:12:57Z", user: "budi@toko.example", modelId: "qwen3-max", status: 200, latencyMs: 977, tokens: 4_118, costMicros: 14_900 },
  { id: "req_9f21", at: "2026-11-08T09:12:40Z", user: "ai@sekolahku.example", modelId: "glm-4.6", status: 200, latencyMs: 733, tokens: 1_502, costMicros: 2_400 },
];
