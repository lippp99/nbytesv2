import type { BadgeTone } from "@/components/app-kit/badge";

// Mock upstream health for the admin overview and Provider page. Every number is an example.
export type ProviderState = "up" | "degraded" | "down";
export type ProviderHealth = {
  providerId: string;
  state: ProviderState;
  uptimePct: number;
  latencyP50Ms: number;
  errorRatePct: number;
  requests24h: number;
};

export const providerHealth: ProviderHealth[] = [
  { providerId: "anthropic", state: "up", uptimePct: 99.98, latencyP50Ms: 412, errorRatePct: 0.04, requests24h: 188_204 },
  { providerId: "openai", state: "up", uptimePct: 99.95, latencyP50Ms: 365, errorRatePct: 0.07, requests24h: 142_117 },
  { providerId: "google", state: "degraded", uptimePct: 98.7, latencyP50Ms: 918, errorRatePct: 2.4, requests24h: 51_920 },
  { providerId: "deepseek", state: "up", uptimePct: 99.9, latencyP50Ms: 288, errorRatePct: 0.11, requests24h: 21_082 },
  { providerId: "moonshot", state: "up", uptimePct: 99.86, latencyP50Ms: 340, errorRatePct: 0.2, requests24h: 8_085 },
  { providerId: "xai", state: "down", uptimePct: 94.1, latencyP50Ms: 0, errorRatePct: 100, requests24h: 1_204 },
];

export const providerStateBadge: Record<ProviderState, { tone: BadgeTone; label: string }> = {
  up: { tone: "success", label: "Normal" },
  degraded: { tone: "warning", label: "Melambat" },
  down: { tone: "danger", label: "Gangguan" },
};
