import "server-only";
import { cache } from "react";
import { and, count, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import {
  API_KEY_DISPLAY_LENGTH, API_KEY_PREFIX, type CreateKeyBody, type CreatedKey, MAX_ACTIVE_KEYS, type UserApiKey,
} from "@/lib/gateway/keys/api-key-contract";
import { hmac, randomToken } from "../auth/crypto";
import { db } from "../db/client";
import { apiKeys, gatewayRequests, users } from "../db/schema";
import { AppError } from "../errors";
import { apiKeyHashKey } from "./gateway-env";
import { keySpentSql, monthStartUtc } from "./request-billing";

// PRD gateway-api §5: "nbk_" + 32 random bytes; only the HMAC is stored. Every query is scoped to the session's user.

const TOUCH_EVERY = sql`interval '1 minute'`; // §5: last_used_at written at most once a minute per key

export type KeyOwner = { keyId: string; userId: string; monthlyBudgetMicros: number | null };

const hashKey = (key: string) => hmac(apiKeyHashKey(), key);

/** A4: at most 20 active keys. The user row is locked so two parallel creates cannot both pass the count. */
export async function createApiKey(userId: string, body: CreateKeyBody): Promise<CreatedKey> {
  const key = `${API_KEY_PREFIX}${randomToken()}`;
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, API_KEY_DISPLAY_LENGTH);
  return db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    const [{ active }] = await tx
      .select({ active: count() })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
    if (active >= MAX_ACTIVE_KEYS) throw new AppError("key_limit_reached", 409);
    const [row] = await tx
      .insert(apiKeys)
      .values({ userId, name: body.name, keyHash, keyPrefix, monthlyBudgetMicros: body.monthlyBudgetMicros })
      .returning({ id: apiKeys.id });
    return { id: row.id, name: body.name, key, keyPrefix, monthlyBudgetMicros: body.monthlyBudgetMicros };
  });
}

/** Active key count for the sidebar; cached per request, since the desktop sidebar and the mobile drawer both ask. */
export const countActiveApiKeys = cache(async (userId: string): Promise<number> => {
  const [{ active }] = await db
    .select({ active: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
  return active;
});

/** The user's active keys, newest first, each with this month's spend in one query (PRD dashboard-api-keys §5.1). */
export async function listUserApiKeys(userId: string): Promise<UserApiKey[]> {
  const rows = await db
    .select({
      id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt, monthlyBudgetMicros: apiKeys.monthlyBudgetMicros, spent: keySpentSql(),
    })
    .from(apiKeys)
    .leftJoin(
      gatewayRequests,
      and(eq(gatewayRequests.apiKeyId, apiKeys.id), gte(gatewayRequests.createdAt, monthStartUtc(new Date()))),
    )
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .groupBy(apiKeys.id)
    .orderBy(desc(apiKeys.createdAt));
  return rows.map(({ spent, createdAt, lastUsedAt, ...key }) => ({
    ...key, createdAt: createdAt.toISOString(), lastUsedAt: lastUsedAt?.toISOString() ?? null, spentThisMonthMicros: spent,
  }));
}

/** Revokes one of the user's own active keys; another user's key, or an unknown id, is a 404. */
export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  const revoked = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });
  if (!revoked.length) throw new AppError("not_found", 404);
}

/** §5: unknown or revoked key -> 401, suspended account -> 403. */
export async function authenticateApiKey(key: string): Promise<KeyOwner> {
  const [row] = await db
    .select({
      keyId: apiKeys.id, userId: apiKeys.userId, monthlyBudgetMicros: apiKeys.monthlyBudgetMicros, status: users.status,
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(and(eq(apiKeys.keyHash, hashKey(key)), isNull(apiKeys.revokedAt)));
  if (!row) throw new AppError("invalid_api_key", 401);
  if (row.status !== "active") throw new AppError("account_suspended", 403);
  await db
    .update(apiKeys)
    .set({ lastUsedAt: sql`now()` })
    .where(and(eq(apiKeys.id, row.keyId), or(isNull(apiKeys.lastUsedAt), lt(apiKeys.lastUsedAt, sql`now() - ${TOUCH_EVERY}`))));
  return { keyId: row.keyId, userId: row.userId, monthlyBudgetMicros: row.monthlyBudgetMicros };
}
