import "server-only";
import { and, count, desc, eq, gt, ne, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { type ActiveSessionsPage, SESSIONS_PAGE_SIZE, sessionCookieName } from "@/lib/auth/auth-contract";
import { db } from "../db/client";
import { sessions, users } from "../db/schema";
import { randomToken, sha256 } from "./crypto";
import { type ClientInfo, countryFlagSvg, countryName, deviceLabel } from "./client-info";

// PRD §6 (proposed values, owner decision §16.3).
const ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 60 * 60 * 1000;
const USER_AGENT_MAX = 256;

export type SessionUser = { id: string; email: string };
export type CurrentSession = { sessionId: string; user: SessionUser };

function cookieOptions(expires: Date) {
  const dev = process.env.NODE_ENV === "development";
  return { httpOnly: true, secure: !dev, sameSite: "lax" as const, path: "/", expires };
}

async function currentTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  return token ? sha256(token) : null;
}

/** New token on every login (no fixation): the old session row of this browser is removed first. */
export async function createSession(userId: string, client: ClientInfo): Promise<void> {
  const oldHash = await currentTokenHash();
  if (oldHash) await db.delete(sessions).where(eq(sessions.tokenHash, oldHash));
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ABSOLUTE_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    expiresAt,
    lastSeenAt: now,
    userAgent: client.userAgent?.slice(0, USER_AGENT_MAX) ?? null,
    ipMasked: client.ipMasked,
    country: client.country,
  });
  (await cookies()).set(sessionCookieName(), token, cookieOptions(expiresAt));
}

/**
 * Always checks the database: no row, expired, idle too long or suspended user -> null. Wrapped in React `cache()`
 * (docs Next authentication.md, DAL): the dashboard layout and the page share one lookup per request, and every new
 * request reads the database again. Route Handlers are not a render pass, so there it runs on every call.
 */
export const readSession = cache(async (): Promise<CurrentSession | null> => {
  const tokenHash = await currentTokenHash();
  if (!tokenHash) return null;
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      lastSeenAt: sessions.lastSeenAt,
      user: { id: users.id, email: users.email, status: users.status },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, tokenHash));
  const now = Date.now();
  if (!row || row.expiresAt.getTime() <= now || row.lastSeenAt.getTime() + IDLE_MS <= now) return null;
  if (row.user.status !== "active") return null;
  if (now - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db.update(sessions).set({ lastSeenAt: new Date(now) }).where(eq(sessions.id, row.sessionId));
  }
  const { id, email } = row.user;
  return { sessionId: row.sessionId, user: { id, email } };
});

/**
 * Logout: drops this browser's session row (if any) and clears the cookie. Returns who was signed in. The cookie is
 * cleared even when the database fails, so this browser is signed out either way; the error still reaches the caller.
 */
export async function deleteCurrentSession(): Promise<SessionUser | null> {
  const store = await cookies();
  try {
    const session = await readSession();
    const tokenHash = await currentTokenHash();
    if (tokenHash) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    return session?.user ?? null;
  } finally {
    store.set(sessionCookieName(), "", { ...cookieOptions(new Date(0)), maxAge: 0 });
  }
}

/** Signs a user out everywhere (used when an account is suspended). */
export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// --- Signed-in devices (PRD active-sessions §6). Every query is scoped to the signed-in user's id.

/** Sessions of this user that readSession would still accept (not expired, not idle too long). */
const aliveSessionsOf = (userId: string, now: number) =>
  and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date(now)), gt(sessions.lastSeenAt, new Date(now - IDLE_MS)));

type Alive = ReturnType<typeof aliveSessionsOf>;

/** One page of rows: this device first, then most recently active. */
function pageRows(alive: Alive, currentId: string, page: number) {
  return db
    .select({
      id: sessions.id, userAgent: sessions.userAgent, ipMasked: sessions.ipMasked, country: sessions.country,
      createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt,
    })
    .from(sessions)
    .where(alive)
    .orderBy(desc(sql`${sessions.id} = ${currentId}`), desc(sessions.lastSeenAt), desc(sessions.id))
    .limit(SESSIONS_PAGE_SIZE)
    .offset((page - 1) * SESSIONS_PAGE_SIZE);
}

/** One page of the user's devices, this one first, then most recently active. null = not signed in. */
export async function listActiveSessions(requestedPage: number): Promise<ActiveSessionsPage | null> {
  const current = await readSession();
  if (!current) return null;
  const alive = aliveSessionsOf(current.user.id, Date.now());
  const wanted = Math.max(1, requestedPage);
  // Count and the requested page run together; only a page past the end needs a second, clamped query.
  const [[{ total }], firstRows] = await Promise.all([
    db.select({ total: count() }).from(sessions).where(alive),
    pageRows(alive, current.sessionId, wanted),
  ]);
  const pages = Math.max(1, Math.ceil(total / SESSIONS_PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const rows = page === wanted ? firstRows : await pageRows(alive, current.sessionId, page);
  const list = rows.map((row) => ({
    id: row.id,
    device: deviceLabel(row.userAgent),
    location: countryName(row.country),
    flagSvg: countryFlagSvg(row.country),
    ip: row.ipMasked,
    signedInAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    current: row.id === current.sessionId,
  }));
  return { sessions: list, page, pages, total };
}

/** Signs out one other device of this user. Unknown or foreign ids delete nothing. Returns whether a row went. */
export async function revokeSession(current: CurrentSession, targetId: string): Promise<boolean> {
  const gone = await db
    .delete(sessions)
    .where(and(eq(sessions.id, targetId), eq(sessions.userId, current.user.id), ne(sessions.id, current.sessionId)))
    .returning({ id: sessions.id });
  return gone.length > 0;
}

/** Signs out every other device of this user; this one stays. Returns how many were signed out. */
export async function revokeOtherSessions(current: CurrentSession): Promise<number> {
  const gone = await db
    .delete(sessions)
    .where(and(eq(sessions.userId, current.user.id), ne(sessions.id, current.sessionId)))
    .returning({ id: sessions.id });
  return gone.length;
}
