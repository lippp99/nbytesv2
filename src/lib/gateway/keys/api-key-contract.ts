// API keys of a user (PRD gateway-api §5). Dashboard endpoints: POST /api/keys, DELETE /api/keys/{id}.

export const API_KEY_PREFIX = "nbk_";
/** Shown in lists: "nbk_" + 4 characters. */
export const API_KEY_DISPLAY_LENGTH = 8;
export const MAX_ACTIVE_KEYS = 20; // A4
export const KEY_NAME_MAX = 40;
/** Sanity bound for a monthly budget: $1,000,000. */
export const MAX_BUDGET_MICROS = 1_000_000 * 1_000_000;
/** Window of the per-key request limit (A3); the count is an admin setting (keyRpm, lib/platform). */
export const KEY_RATE_WINDOW_SECONDS = 60;

export type ApiKeyErrorCode = "key_limit_reached" | "not_found";
export type CreateKeyBody = { name: string; monthlyBudgetMicros: number | null };
/** The full key is in this reply only, never again (§5). */
export type CreatedKey = { id: string; name: string; key: string; keyPrefix: string; monthlyBudgetMicros: number | null };

/** One active key as the dashboard lists it (PRD dashboard-api-keys §5.1). Never the hash or the full key. */
export type UserApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  monthlyBudgetMicros: number | null;
  spentThisMonthMicros: number;
};

/** From this share of the monthly budget the page says "nearly used up" (PRD dashboard-api-keys F5). */
export const NEAR_BUDGET_PERCENT = 85;
export type BudgetState = "none" | "ok" | "near" | "reached";

/** Integer math only: spent and budget are micro-USD, at most $1,000,000 × 100 stays a safe integer. */
export function budgetState(spentMicros: number, budgetMicros: number | null): BudgetState {
  if (budgetMicros === null) return "none";
  if (spentMicros >= budgetMicros) return "reached";
  return spentMicros * 100 >= budgetMicros * NEAR_BUDGET_PERCENT ? "near" : "ok";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Name 1–40 characters after trimming; budget a positive whole micro-USD amount or null. */
export function parseCreateKeyBody(json: unknown): CreateKeyBody | null {
  if (!isRecord(json) || typeof json.name !== "string") return null;
  const name = json.name.trim();
  if (!name || name.length > KEY_NAME_MAX) return null;
  const budget = json.monthlyBudgetMicros ?? null;
  if (budget !== null) {
    if (typeof budget !== "number" || !Number.isSafeInteger(budget) || budget <= 0 || budget > MAX_BUDGET_MICROS) return null;
  }
  return { name, monthlyBudgetMicros: budget as number | null };
}

/** The key from the request: Authorization: Bearer <key>, or x-api-key (Anthropic SDK style, §5). */
export function readApiKey(headers: Headers): string | null {
  const bearer = /^Bearer\s+(\S+)$/i.exec(headers.get("authorization") ?? "")?.[1];
  const key = bearer ?? headers.get("x-api-key")?.trim();
  return key && key.startsWith(API_KEY_PREFIX) && key.length <= 128 ? key : null;
}
