import "server-only";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../db/client";
import { apiKeys, gatewayRequests } from "../db/schema";

// Quick Start progress facts of one user (PRD dashboard-quick-start §5.1, Q1): two existence checks, run in parallel.

export type SetupFacts = {
  /** A successful request through an API key; Playground requests (no key) do not count. */
  firstRequest: boolean;
  /** An active key with a monthly budget. */
  budgetSet: boolean;
};

const one = { one: sql`1` };

export async function setupFacts(userId: string): Promise<SetupFacts> {
  const g = gatewayRequests;
  const [request, budget] = await Promise.all([
    db.select(one).from(g).where(and(eq(g.userId, userId), isNotNull(g.apiKeyId), eq(g.state, "succeeded"))).limit(1),
    db.select(one).from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt), isNotNull(apiKeys.monthlyBudgetMicros))).limit(1),
  ]);
  return { firstRequest: request.length > 0, budgetSet: budget.length > 0 };
}
