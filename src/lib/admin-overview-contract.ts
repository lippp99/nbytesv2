// Admin overview (PRD admin-overview §3, K1–K5). Shapes shared by the server queries and the page, plus the pure rules
// (margin, coverage, alerts, filling empty days) so they can be tested without a database.
import type { SurplusBalance } from "./admin-gateway/upstream-contract";

const BP = 10_000;
export const TREND_DAYS = 30;

export type MonthFigures = {
  /** Charged to users this month (all settled requests). */
  chargeMicros: number;
  /** Surplus cost and the charge of the same requests: only rows whose cost is known (billing §10). */
  knownCostMicros: number;
  knownCostChargeMicros: number;
  costPending: number;
  depositIdr: number;
  depositCreditMicros: number;
  depositCount: number;
};

export type DayFigures = { requests: number; failed: number; failedOurs: number; p50LatencyMs: number | null };
export type UserFigures = { total: number; active30: number; newThisMonth: number; suspended: number };

export type MoneyHealth = {
  surplus: SurplusBalance | null;
  userBalanceMicros: number;
  userHeldMicros: number;
  negativeBalances: number;
  idrPerUsd: number | null;
  rateSetAt: string | null;
  depositsPending: number;
  depositsStuck: number;
};

export type TrendDay = { date: string; chargeMicros: number; costMicros: number; requests: number; failed: number };
export type TopModel = {
  modelId: string; requests: number; inputTokens: number; outputTokens: number; chargeMicros: number; costMicros: number;
  /** Charge of the requests whose Surplus cost is known: the margin compares only these with costMicros. */
  knownCostChargeMicros: number;
};
export type TopUser = { email: string | null; requests: number; chargeMicros: number; balanceMicros: number };

export type AlertFacts = {
  surplusUnreadable: boolean;
  /** K4: Surplus credit below what users could still spend. */
  coverageLow: boolean;
  serviceUnavailable24h: number;
  negativeMargin24h: number;
  costPendingOld: number;
  depositsStuck: number;
  webhookMismatch7d: number;
  noExchangeRate: boolean;
  adminLocked24h: number;
  totpFailed24h: number;
  negativeBalances: number;
};

export type AlertKind = keyof AlertFacts;
export type OverviewAlert = { kind: AlertKind; tone: "danger" | "warning"; count: number };

/** Gross margin of the requests whose cost is known; percent in basis points (null when nothing was charged). */
export function grossMargin(chargeMicros: number, costMicros: number): { micros: number; bp: number | null } {
  const micros = chargeMicros - costMicros;
  return { micros, bp: chargeMicros > 0 ? Math.round((micros * BP) / chargeMicros) : null };
}

/** Surplus credit ÷ users' balance in basis points; null when either side is unknown or users hold nothing. */
export function coverageBp(surplusMicros: number | null, userBalanceMicros: number): number | null {
  if (surplusMicros === null || userBalanceMicros <= 0) return null;
  return Math.floor((surplusMicros * BP) / userBalanceMicros);
}

// Most urgent first: money that cannot be served, then money that is wrong, then housekeeping and security.
const ORDER: { kind: AlertKind; tone: OverviewAlert["tone"] }[] = [
  { kind: "surplusUnreadable", tone: "danger" }, { kind: "coverageLow", tone: "danger" },
  { kind: "serviceUnavailable24h", tone: "danger" }, { kind: "negativeMargin24h", tone: "danger" },
  { kind: "webhookMismatch7d", tone: "danger" }, { kind: "noExchangeRate", tone: "warning" },
  { kind: "depositsStuck", tone: "warning" }, { kind: "costPendingOld", tone: "warning" },
  { kind: "negativeBalances", tone: "warning" }, { kind: "adminLocked24h", tone: "danger" },
  { kind: "totpFailed24h", tone: "warning" },
];

/** §3.5: one alert per fact that is true or above zero, in a fixed order. */
export function buildAlerts(facts: AlertFacts): OverviewAlert[] {
  return ORDER.flatMap(({ kind, tone }) => {
    const value = facts[kind];
    const count = typeof value === "boolean" ? Number(value) : value;
    return count > 0 ? [{ kind, tone, count }] : [];
  });
}

/** Every UTC day of the window, oldest first, with zeros where nothing happened. */
export function fillDays(rows: TrendDay[], today: Date, days = TREND_DAYS): TrendDay[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, chargeMicros: 0, costMicros: 0, requests: 0, failed: 0 };
  });
}
