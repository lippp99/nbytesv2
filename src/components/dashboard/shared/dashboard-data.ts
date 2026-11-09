// Mock data for the dashboard frontend until the backend exists. Every number is an example.
// Money is integer micro-dollars (backend-security.md); dates are UTC ISO strings.
export const account = {
  userName: "Rina Wulandari",
  email: "anda@perusahaan.example",
  plan: "Paket Pro",
  billingPeriod: "November 2026",
};

/** Prepaid balance shown in the header wallet. */
export const wallet = { creditMicros: 42_500_000 };

export type ModelUsage = { modelId: string; requests: number; tokens: number; costMicros: number };

export const usageByModel: ModelUsage[] = [
  { modelId: "claude-sonnet-4.5", requests: 588_204, tokens: 21_400_000, costMicros: 96_400_000 },
  { modelId: "gpt-5", requests: 402_117, tokens: 15_900_000, costMicros: 61_300_000 },
  { modelId: "gemini-2.5-pro", requests: 141_920, tokens: 6_800_000, costMicros: 18_200_000 },
  { modelId: "deepseek-v3.2", requests: 61_082, tokens: 3_100_000, costMicros: 4_100_000 },
  { modelId: "kimi-k2", requests: 20_085, tokens: 1_000_000, costMicros: 2_400_000 },
];

export const usageTotals = {
  requests: usageByModel.reduce((sum, row) => sum + row.requests, 0),
  tokens: usageByModel.reduce((sum, row) => sum + row.tokens, 0),
  costMicros: usageByModel.reduce((sum, row) => sum + row.costMicros, 0),
  errors: 41,
  latencyP50Ms: 211,
};

export type ApiKey = {
  id: string;
  name: string;
  /** Only the first and last characters are ever shown after creation. */
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
  budgetMicros: number | null;
  spentMicros: number;
};

export const apiKeys: ApiKey[] = [
  { id: "key_1", name: "Produksi", preview: "nb-live-…4f2a", createdAt: "2026-08-14", lastUsedAt: "2026-11-08",
    budgetMicros: 150_000_000, spentMicros: 128_600_000 },
  { id: "key_2", name: "Staging", preview: "nb-live-…9c01", createdAt: "2026-09-02", lastUsedAt: "2026-11-07",
    budgetMicros: 40_000_000, spentMicros: 21_350_000 },
  { id: "key_3", name: "Laptop Rina", preview: "nb-live-…a7e3", createdAt: "2026-10-21", lastUsedAt: null,
    budgetMicros: null, spentMicros: 0 },
];

export const monthlyBudgetMicros = 300_000_000;
