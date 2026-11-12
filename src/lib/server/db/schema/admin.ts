import { bigint, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Admin auth tables (PRD backend-auth-admin §13). Fully separate from users/sessions. Every time is timestamptz (UTC).
// One Owner, no team and no roles (owner, 2026-11-11): admins are made only by scripts/create-admin-owner.ts.
// No runtime imports besides drizzle: scripts/create-admin-owner.ts loads this file directly with Node.
const at = (name: string) => timestamp(name, { withTimezone: true });

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // normalized by normalizeEmail
    name: text("name"),
    // invited = made by the script, first login (TOTP setup) not done yet; active after it.
    status: text("status", { enum: ["invited", "active"] }).notNull().default("invited"),
    // AES-256-GCM with ADMIN_TOTP_KEY; null = TOTP pending (not enrolled yet, or reset by the Owner).
    totpSecretEnc: text("totp_secret_enc"),
    totpLastStep: bigint("totp_last_step", { mode: "number" }), // anti-replay: last accepted time step
    totpEnabledAt: at("totp_enabled_at"),
    inviteExpiresAt: at("invite_expires_at"),
    // C3: set for 1 hour after 10 wrong TOTP/backup codes within an hour.
    lockedUntil: at("locked_until"),
    lastLoginAt: at("last_login_at"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("admins_email_idx").on(t.email),
    check("admins_status_check", sql`${t.status} in ('invited', 'active')`),
  ],
);

export const adminBackupCodes = pgTable(
  "admin_backup_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(), // hmac(AUTH_HASH_KEY, code)
    usedAt: at("used_at"),
  },
  (t) => [index("admin_backup_codes_admin_id_idx").on(t.adminId)],
);

// Between step 2 (email code) and step 3 (TOTP): proves the email code passed in this browser.
export const adminLoginTickets = pgTable(
  "admin_login_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
    totpAttempts: integer("totp_attempts").notNull().default(0),
    pendingSecretEnc: text("pending_secret_enc"), // enrollment only; lives no longer than the ticket
    expiresAt: at("expires_at").notNull(),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_login_tickets_token_hash_idx").on(t.tokenHash), index("admin_login_tickets_admin_id_idx").on(t.adminId)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
    expiresAt: at("expires_at").notNull(),
    lastSeenAt: at("last_seen_at").notNull(),
    userAgent: text("user_agent"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_sessions_token_hash_idx").on(t.tokenHash), index("admin_sessions_admin_id_idx").on(t.adminId)],
);

// Append-only: the app only inserts. Email and IP as HMAC (auth_events pattern), plus the masked IP for display
// (PRD admin-users-audit U3). Retention: open (C5).
export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    target: text("target"), // id of the admin row the first-Owner script created
    emailHash: text("email_hash"),
    ipHash: text("ip_hash"),
    ipMasked: text("ip_masked"), // "103.47.xx.xx" (maskIp), readable on the Audit page; the full IP is never stored
    reason: text("reason"), // why the admin did it, where the action asks for one (suspending a user)
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [index("admin_audit_events_admin_id_idx").on(t.adminId), index("admin_audit_events_created_at_idx").on(t.createdAt)],
);
