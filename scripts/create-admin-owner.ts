// First Owner (PRD backend-auth-admin §9, C1): npm run admin:create-owner -- <email>
// Run by the owner on the server/local DB only; there is no web endpoint for this. Creates the one admin (the Owner;
// no team, no roles) with TOTP pending (§16a: valid 72 h; the first login enrolls the authenticator and activates it).
// No "server-only" modules: that package refuses to load outside the React server, so the DB is opened here directly.
import { createHmac } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { isValidEmail, normalizeEmail } from "../src/lib/auth/auth-contract.ts";
import { adminAuditEvents, admins } from "../src/lib/server/db/schema/admin.ts";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // = INVITE_TTL_MS in lib/server/admin-auth/admin-rules (C4)

function fail(message: string): never {
  console.error(`[admin:create-owner] ${message}`);
  process.exit(1);
}

const email = normalizeEmail(process.argv[2] ?? "");
if (!isValidEmail(email)) fail("Pakai: npm run admin:create-owner -- <email>");
const { DATABASE_URL, AUTH_HASH_KEY } = process.env;
if (!DATABASE_URL || !AUTH_HASH_KEY) fail("DATABASE_URL dan AUTH_HASH_KEY wajib ada (lihat .env.example).");
// Same keyed hash as emailKey() in lib/server/auth/request-guard, so audit rows match the app's.
const emailHash = createHmac("sha256", Buffer.from(AUTH_HASH_KEY, "base64")).update(`email:${email}`).digest("hex");

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function createOwner(): Promise<string> {
  return db.transaction(async (tx) => {
    const [active] = await tx
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.status, "active"))
      .limit(1);
    if (active) throw new Error("Sudah ada Owner aktif. Konsol admin hanya untuk satu Owner.");
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    // One Owner only: an unused invite for another email (a typo, say) is replaced; the same email renews its 72 h.
    await tx.delete(admins).where(and(eq(admins.status, "invited"), ne(admins.email, email)));
    const [row] = await tx
      .insert(admins)
      .values({ email, status: "invited", inviteExpiresAt })
      .onConflictDoUpdate({ target: admins.email, set: { inviteExpiresAt }, setWhere: eq(admins.status, "invited") })
      .returning({ id: admins.id, inviteExpiresAt: admins.inviteExpiresAt });
    if (!row) throw new Error("Email ini sudah terdaftar sebagai Owner aktif.");
    await tx.insert(adminAuditEvents).values({ type: "invited", target: row.id, emailHash });
    return row.inviteExpiresAt!.toISOString();
  });
}

try {
  const expires = await createOwner();
  console.info(`[admin:create-owner] Owner diundang. Masuk lewat /admin/login sebelum ${expires} (UTC).`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await pool.end();
}
