import "server-only";
import { and, eq, or, gt, lt } from "drizzle-orm";
import type { db } from "../db/client";
import { deposits, userBalances } from "../db/schema";
import { AppError } from "../errors";

// PRD gateway-pricing-billing B6: no account deletion while a deposit is pending, a hold is active or the balance is
// negative. A positive balance does not block: it is forfeited (the popup that says so is UI, still to come).
// Video/music jobs do not exist yet; add them here when they do.

type Reader = Pick<typeof db, "select">;

export async function assertAccountDeletable(reader: Reader, userId: string): Promise<void> {
  const [pending] = await reader
    .select({ id: deposits.id })
    .from(deposits)
    .where(and(eq(deposits.userId, userId), eq(deposits.status, "pending")))
    .limit(1);
  const [open] = await reader
    .select({ userId: userBalances.userId })
    .from(userBalances)
    .where(and(eq(userBalances.userId, userId), or(gt(userBalances.heldMicros, 0), lt(userBalances.balanceMicros, 0))));
  if (pending || open) throw new AppError("blocked", 409);
}
