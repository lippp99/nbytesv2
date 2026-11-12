import type { CatalogModel } from "@/lib/gateway/catalog-contract";

// Pure rules of the Quick Start page (PRD dashboard-quick-start F2, Q2, Q3), tested without a browser.

export type StepState = "done" | "current" | "todo";
export type StepId = "account" | "key" | "balance" | "request" | "budget";
/** What the account has done so far; every flag comes from the database. */
export type SetupProgress = { hasKey: boolean; hasBalance: boolean; firstRequest: boolean; budgetSet: boolean };

export const STEP_ORDER: StepId[] = ["account", "key", "balance", "request", "budget"];

/** Done steps from the facts; the first step not done is current, the rest are todo. */
export function stepStates(p: SetupProgress): Record<StepId, StepState> {
  const done: Record<StepId, boolean> = {
    account: true, key: p.hasKey, balance: p.hasBalance, request: p.firstRequest, budget: p.budgetSet,
  };
  const current = STEP_ORDER.find((id) => !done[id]);
  return Object.fromEntries(STEP_ORDER.map((id) => [id, done[id] ? "done" : id === current ? "current" : "todo"])) as
    Record<StepId, StepState>;
}

/** Q2: the n models with the lowest input price, ties by output price then name. */
export function cheapestModels(models: CatalogModel[], n = 5): CatalogModel[] {
  return [...models]
    .sort((a, b) => a.inputMicros - b.inputMicros || a.outputMicros - b.outputMicros || a.name.localeCompare(b.name))
    .slice(0, n);
}
