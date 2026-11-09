import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { authRateLimits } from "../db/schema";
import { rateLimitedError } from "../errors";
import { logAuthEvent } from "./auth-events";

// shortcut: rate limit di Postgres cukup untuk satu region; pindah ke store khusus jika trafik login tinggi atau multi-region
// shortcut: fixed windows, so a 60 s cooldown can let two sends through across a window edge; use a sliding log if abused.

const windowStartOf = (windowSeconds: number, now: number) =>
  new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);

/** Counts one hit; returns 0 when within `limit`, else the seconds until the window resets. */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<number> {
  const now = Date.now();
  const windowStart = windowStartOf(windowSeconds, now);
  const [row] = await db
    .insert(authRateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [authRateLimits.key, authRateLimits.windowStart],
      set: { count: sql`${authRateLimits.count} + 1` },
    })
    .returning({ count: authRateLimits.count });
  return row.count > limit ? (windowStart.getTime() + windowSeconds * 1000 - now) / 1000 : 0;
}

/** Takes back one hit in the current window (a send that failed must not start the cooldown). */
export async function undoHit(key: string, windowSeconds: number): Promise<void> {
  await db
    .update(authRateLimits)
    .set({ count: sql`greatest(${authRateLimits.count} - 1, 0)` })
    .where(and(eq(authRateLimits.key, key), eq(authRateLimits.windowStart, windowStartOf(windowSeconds, Date.now()))));
}

/** hit() that logs and throws 429 rate_limited when over the limit. */
export async function enforceLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  who: { emailHash: string; ipHash: string },
): Promise<void> {
  const wait = await hit(key, limit, windowSeconds);
  if (!wait) return;
  await logAuthEvent("rate_limited", who);
  throw rateLimitedError(wait);
}
