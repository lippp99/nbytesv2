import "server-only";
import { eq } from "drizzle-orm";
import { authEnv } from "../../auth/auth-env";
import { db } from "../../db/client";
import { adminLoginTickets } from "../../db/schema";
import { AppError } from "../../errors";
import { canSignIn, ticketUsable } from "../admin-rules";
import { seal } from "../crypto/secret-box";
import { base32Encode, newTotpSecret, otpauthUrl } from "../crypto/totp";
import { lockTicket, ticketTokenHash } from "./ticket";

/**
 * PRD §7: a new secret for an admin whose TOTP is pending. It lives (encrypted) only on the login ticket until the first
 * correct code, so an unfinished enrollment stores nothing permanent. Calling again replaces the secret.
 */
export async function startEnrollment(): Promise<{ secret: string; otpauthUrl: string }> {
  const tokenHash = await ticketTokenHash();
  if (!tokenHash) throw new AppError("expired", 410);
  const secret = newTotpSecret();
  const result = await db.transaction(async (tx) => {
    const now = new Date();
    const row = await lockTicket(tx, tokenHash);
    if (!row || !ticketUsable(row.ticket, now) || !canSignIn(row.admin, now)) return "expired" as const;
    if (row.admin.totpSecretEnc) return "enrolled" as const;
    await tx
      .update(adminLoginTickets)
      .set({ pendingSecretEnc: seal(authEnv().adminTotpKey, secret) })
      .where(eq(adminLoginTickets.id, row.ticket.id));
    return { email: row.admin.email };
  });
  if (result === "expired") throw new AppError("expired", 410);
  if (result === "enrolled") throw new AppError("invalid_input", 400);
  const base32 = base32Encode(secret);
  return { secret: base32, otpauthUrl: otpauthUrl(result.email, base32) };
}
