// Usage page of the dashboard (PRD dashboard-usage §5.2). Client-safe: types and pure helpers only. Money is integer
// micro-USD; days are WIB (U1). Upstream telemetry and nbytes' own cost never appear here.
import { wibDay, wibDayStart } from "./date-format.ts";

export const USAGE_DAYS = 30;
/** A request the user stopped mid-stream: shown as "stopped", not counted as an error (U5). */
export const STOPPED_ERROR_CODE = "client_disconnected";

export type UsageSummary = {
  chargeMicros: number;
  requests: number;
  /** Failed, not counting the ones the user stopped. */
  errors: number;
  stopped: number;
  /** Still running: their hold is not counted as cost yet (F4). */
  pending: number;
  tokens: number;
  /** Median duration of successful requests, from sending until the answer finished (D4); null without any. */
  medianMs: number | null;
};

export type UsageDay = { date: string; chargeMicros: number };
export type ModelUsage = { modelId: string; name: string | null; requests: number; tokens: number; chargeMicros: number };
/** keyId null: the Playground, or a key that no longer exists. */
export type KeyUsage = {
  keyId: string | null; name: string | null; keyPrefix: string | null; revoked: boolean; requests: number; chargeMicros: number;
};

export type UsageData = { summary: UsageSummary; days: UsageDay[]; models: ModelUsage[]; keys: KeyUsage[] };

/** 00.00 WIB of the first day of the window that ends today (today included). */
export function windowStart(now: Date, days = USAGE_DAYS): Date {
  return new Date(wibDayStart(wibDay(now)).getTime() - (days - 1) * 86_400_000);
}

/** Every WIB day of the window, oldest first, with 0 where nothing was charged. */
export function fillUsageDays(rows: UsageDay[], now: Date, days = USAGE_DAYS): UsageDay[] {
  const byDate = new Map(rows.map((r) => [r.date, r.chargeMicros]));
  const start = windowStart(now, days).getTime();
  return Array.from({ length: days }, (_, i) => {
    const date = wibDay(new Date(start + i * 86_400_000));
    return { date, chargeMicros: byDate.get(date) ?? 0 };
  });
}

/** 850 -> "850 ms", 2_430 -> "2,4 dtk" (one decimal, comma). */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const tenths = Math.round(ms / 100);
  return `${Math.floor(tenths / 10)},${tenths % 10} dtk`;
}

/** Share of failed requests, one decimal with a comma: "0%", "<0,1%", "33,3%" (D5). */
export function errorRateLabel(errors: number, requests: number): string {
  if (errors <= 0 || requests <= 0) return "0%";
  const tenths = Math.round((errors * 1000) / requests);
  if (tenths === 0) return "<0,1%";
  return `${Math.floor(tenths / 10)}${tenths % 10 ? `,${tenths % 10}` : ""}%`;
}
