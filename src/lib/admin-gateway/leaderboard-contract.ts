// Admin Leaderboard: accounts and models ranked by tokens (input + output) in one period. Periods, their URL form and
// the month/year lists are the Usage page's (usage-contract). Shared by the server query and the page, plus the pure
// ranking rule so it can be tested without a database.
import { type UsagePeriod, periodParams } from "./usage-contract.ts";

/** Rows per list; a leaderboard shows the top, not everyone (the Usage page lists everyone). */
export const LEADERBOARD_SIZE = 10;

/** The account's model with the most tokens in the period (catalog name, else model id). */
export type Favourite = { label: string; tokens: number } | null;

export type LeaderUser = {
  rank: number; userId: string; email: string; firstName: string | null; lastName: string | null;
  tokens: number; requests: number; models: number; topModel: Favourite;
};

/** name: display name from the catalog (Models & pricing); null when the model is not in it. */
export type LeaderModel = {
  rank: number; modelId: string; name: string | null; tokens: number; requests: number;
};

export type Leaderboard = {
  period: UsagePeriod;
  months: string[];
  years: string[];
  /** Every token of the period, deleted accounts included, so shares add up against the whole. */
  totalTokens: number;
  users: LeaderUser[];
  models: LeaderModel[];
};

/**
 * Standard competition ranking of values already sorted high to low: equal values share a rank and the next rank
 * skips (100, 80, 80, 50 -> 1, 2, 2, 4).
 */
export const ranks = (sortedDesc: number[]): number[] => sortedDesc.map((v) => sortedDesc.indexOf(v) + 1);

export function leaderboardHref(period: UsagePeriod, currentMonth: string): string {
  const text = periodParams(period, currentMonth).toString();
  return text ? `/admin/leaderboard?${text}` : "/admin/leaderboard";
}
