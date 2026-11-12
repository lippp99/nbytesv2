import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { adminTicketCookieName } from "@/lib/admin-auth/admin-auth-contract";
import { randomToken, sha256 } from "../../auth/crypto";
import { db } from "../../db/client";
import type { Tx } from "../../auth/otp/challenge";
import { adminLoginTickets, admins } from "../../db/schema";
import { TICKET_TTL_MS } from "../admin-rules";
import { strictCookie } from "../admin-session";

// Login ticket (PRD §4, §16a): proves step 2 passed in this browser. Cookie holds a random token, the DB its sha256.

/** One open login per admin: older tickets (other tabs, other browsers) stop working. */
export async function createTicket(adminId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + TICKET_TTL_MS);
  await db.transaction(async (tx) => {
    await tx.delete(adminLoginTickets).where(eq(adminLoginTickets.adminId, adminId));
    await tx.insert(adminLoginTickets).values({ adminId, tokenHash: sha256(token), expiresAt });
  });
  (await cookies()).set(adminTicketCookieName(), token, strictCookie(expiresAt));
}

export async function ticketTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(adminTicketCookieName())?.value;
  return token ? sha256(token) : null;
}

/** Called when the session is made or the ticket is spent. */
export async function clearTicketCookie(): Promise<void> {
  (await cookies()).set(adminTicketCookieName(), "", { ...strictCookie(new Date(0)), maxAge: 0 });
}

export type TicketRow = NonNullable<Awaited<ReturnType<typeof lockTicket>>>;

/** The ticket and its admin, both rows locked for the caller's transaction (attempts cannot race). */
export async function lockTicket(tx: Tx, tokenHash: string) {
  const [row] = await tx
    .select({
      ticket: {
        id: adminLoginTickets.id, totpAttempts: adminLoginTickets.totpAttempts,
        expiresAt: adminLoginTickets.expiresAt, pendingSecretEnc: adminLoginTickets.pendingSecretEnc,
      },
      admin: {
        id: admins.id, email: admins.email, status: admins.status, inviteExpiresAt: admins.inviteExpiresAt,
        lockedUntil: admins.lockedUntil, totpSecretEnc: admins.totpSecretEnc, totpLastStep: admins.totpLastStep,
      },
    })
    .from(adminLoginTickets)
    .innerJoin(admins, eq(admins.id, adminLoginTickets.adminId))
    .where(eq(adminLoginTickets.tokenHash, tokenHash))
    .for("update");
  return row;
}
