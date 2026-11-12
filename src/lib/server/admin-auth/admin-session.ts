import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { type AdminMe, adminSessionCookieName } from "@/lib/admin-auth/admin-auth-contract";
import { randomToken, sha256 } from "../auth/crypto";
import { db } from "../db/client";
import { adminSessions, admins } from "../db/schema";
import { currentPlatformSettings } from "../platform/settings";
import { SESSION_TOUCH_MS, sessionAlive } from "./admin-rules";

// Admin sessions (PRD backend-auth-admin §8): own table and cookie, 4/8/12 h absolute (admin Settings, from the next
// login on), 30 min idle, SameSite=Strict.

const USER_AGENT_MAX = 256;

export type AdminSession = { sessionId: string; admin: AdminMe };

/** Shared by the session and ticket cookies. Set/delete only from Route Handlers (docs: cookies.md). */
export function strictCookie(expires: Date) {
  const dev = process.env.NODE_ENV === "development";
  return { httpOnly: true, secure: !dev, sameSite: "strict" as const, path: "/", expires };
}

async function currentTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(adminSessionCookieName())?.value;
  return token ? sha256(token) : null;
}

/** New token on every login; the old session row of this browser is removed first (no fixation). */
export async function createAdminSession(adminId: string, userAgent: string | null): Promise<void> {
  const oldHash = await currentTokenHash();
  if (oldHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, oldHash));
  const token = randomToken();
  const now = new Date();
  const hours = (await currentPlatformSettings()).adminSessionHours;
  const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  await db.insert(adminSessions).values({
    adminId,
    tokenHash: sha256(token),
    expiresAt,
    lastSeenAt: now,
    userAgent: userAgent?.slice(0, USER_AGENT_MAX) ?? null,
  });
  (await cookies()).set(adminSessionCookieName(), token, strictCookie(expiresAt));
}

/**
 * Always reads the database (status and TOTP state can change at any time). React `cache()` shares one lookup per
 * render; Route Handlers are not a render pass, so there it runs on every call.
 */
export const readAdminSession = cache(async (): Promise<AdminSession | null> => {
  const tokenHash = await currentTokenHash();
  if (!tokenHash) return null;
  const [row] = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      lastSeenAt: adminSessions.lastSeenAt,
      admin: { id: admins.id, email: admins.email, name: admins.name, status: admins.status },
      totpSecretEnc: admins.totpSecretEnc,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(eq(adminSessions.tokenHash, tokenHash));
  const now = Date.now();
  if (!row || !sessionAlive({ ...row, status: row.admin.status, totpEnabled: !!row.totpSecretEnc }, now)) return null;
  if (now - row.lastSeenAt.getTime() > SESSION_TOUCH_MS) {
    await db.update(adminSessions).set({ lastSeenAt: new Date(now) }).where(eq(adminSessions.id, row.sessionId));
  }
  const { id, email, name } = row.admin;
  return { sessionId: row.sessionId, admin: { id, email, name } };
});

/** Logout: drops this browser's row and clears the cookie, even when the database fails. Returns who it was. */
export async function deleteCurrentAdminSession(): Promise<AdminMe | null> {
  const store = await cookies();
  try {
    const session = await readAdminSession();
    const tokenHash = await currentTokenHash();
    if (tokenHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
    return session?.admin ?? null;
  } finally {
    store.set(adminSessionCookieName(), "", { ...strictCookie(new Date(0)), maxAge: 0 });
  }
}
