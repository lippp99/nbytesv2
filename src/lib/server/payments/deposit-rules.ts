import "server-only";
import { desc } from "drizzle-orm";
import { DEFAULT_DEPOSIT_RULES, type DepositRules } from "@/lib/payments/deposit-contract";
import { db } from "../db/client";
import { logAdminEvent } from "../admin-auth/audit";
import { depositRules } from "../db/schema";

// Deposit limits and fee (PRD gateway-pricing-billing B2, B3), set by an admin. No row yet -> the owner's defaults.

/** The rules in force: the newest row, or the defaults when no admin has saved any. */
export async function currentDepositRules(): Promise<DepositRules> {
  const [row] = await db
    .select({
      minIdr: depositRules.minIdr, maxIdr: depositRules.maxIdr, feeBp: depositRules.feeBp, presetsIdr: depositRules.presetsIdr,
    })
    .from(depositRules)
    .orderBy(desc(depositRules.createdAt))
    .limit(1);
  return row ?? DEFAULT_DEPOSIT_RULES;
}

/** New row plus an audit event in one transaction; old rows are never updated, so they are the history. */
export async function setDepositRules(adminId: string, rules: DepositRules, ipHash: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.insert(depositRules).values({ ...rules, setBy: adminId }).returning({ id: depositRules.id });
    await logAdminEvent("deposit_rules_set", { adminId, ipHash }, { target: row.id }, tx);
  });
}
