import "server-only";
import { type SQL, and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  type UserFilter, type UserStatusBody, type UsersPage, USERS_PAGE_SIZE,
} from "@/lib/admin-users/user-admin-contract";
import { logAdminEvent } from "../admin-auth/audit";
import { db } from "../db/client";
import { likeContains as contains } from "../db/like-pattern";
import { apiKeys, gatewayRequests, sessions, userBalances, users } from "../db/schema";
import { AppError } from "../errors";

// Admin side of user accounts (PRD admin-users-audit §3). Callers check the admin session.

const monthStartUtc = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

function whereOf(filter: UserFilter, search: string | null): SQL | undefined {
  const status = filter === "all" ? undefined : eq(users.status, filter);
  if (!search) return status;
  const pattern = contains(search);
  const fullName = sql`coalesce(${users.firstName}, '') || ' ' || coalesce(${users.lastName}, '')`;
  return and(status, or(ilike(users.email, pattern), ilike(fullName, pattern)));
}

/** Newest accounts first; the page is clamped to the last one. Two counts per row, both on indexed columns. */
export async function listUsers(filter: UserFilter, search: string | null, requestedPage: number): Promise<UsersPage> {
  const where = whereOf(filter, search);
  const [{ total }] = await db.select({ total: count() }).from(users).where(where);
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const monthStart = monthStartUtc(new Date());
  const rows = await db
    .select({
      id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, status: users.status,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
      balanceMicros: sql<number>`coalesce(${userBalances.balanceMicros}, 0)`.mapWith(Number),
      heldMicros: sql<number>`coalesce(${userBalances.heldMicros}, 0)`.mapWith(Number),
      spentMonthMicros: sql<number>`(select coalesce(sum(${gatewayRequests.chargeMicros}), 0) from ${gatewayRequests}
        where ${gatewayRequests.userId} = ${users.id} and ${gatewayRequests.createdAt} >= ${monthStart})`.mapWith(Number),
      activeKeys: sql<number>`(select count(*) from ${apiKeys}
        where ${apiKeys.userId} = ${users.id} and ${apiKeys.revokedAt} is null)`.mapWith(Number),
    })
    .from(users)
    .leftJoin(userBalances, eq(userBalances.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(USERS_PAGE_SIZE)
    .offset((page - 1) * USERS_PAGE_SIZE);
  return {
    page, pages, total,
    users: rows.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString() })),
  };
}

/**
 * §3.3: status, sessions and the audit row change in one transaction, so there is no suspension without a trace.
 * Suspending signs the user out everywhere; login and API keys are refused by the existing status checks (U4: keys stay,
 * they work again after restoring). Asking for the status the user already has changes nothing and writes no row.
 */
export async function changeUserStatus(adminId: string, userId: string, body: UserStatusBody, ipHash: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [user] = await tx.select({ status: users.status }).from(users).where(eq(users.id, userId)).for("update");
    if (!user) throw new AppError("not_found", 404);
    if (user.status === body.status) return;
    await tx.update(users).set({ status: body.status }).where(eq(users.id, userId));
    if (body.status === "suspended") await tx.delete(sessions).where(eq(sessions.userId, userId));
    const type = body.status === "suspended" ? "user_suspended" : "user_restored";
    await logAdminEvent(type, { adminId, ipHash }, { target: userId, reason: body.reason ?? undefined }, tx);
  });
}
