import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// User auth tables (PRD backend-auth-user §9). Every time is timestamptz, stored in UTC.
const at = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // normalized by normalizeEmail
    // Set by the register tab (normalized by normalizeName); null for accounts made before it. Last name is optional.
    firstName: text("first_name"),
    lastName: text("last_name"),
    status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
    emailVerifiedAt: at("email_verified_at").notNull(),
    termsAcceptedAt: at("terms_accepted_at").notNull(),
    termsVersion: text("terms_version").notNull(),
    lastLoginAt: at("last_login_at"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  // The DB refuses any other status, so the auth flow never meets one it does not handle.
  (t) => [uniqueIndex("users_email_idx").on(t.email), check("users_status_check", sql`${t.status} in ('active', 'suspended')`)],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: at("expires_at").notNull(),
    consumedAt: at("consumed_at"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [index("otp_challenges_email_purpose_idx").on(t.email, t.purpose)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: at("expires_at").notNull(),
    lastSeenAt: at("last_seen_at").notNull(),
    createdAt: at("created_at").notNull().defaultNow(),
    userAgent: text("user_agent"),
    // Masked only ("103.47.xx.xx"): the full IP is never stored (PRD active-sessions §6.6).
    ipMasked: text("ip_masked"),
    // Cloudflare country code ("ID", or "T1" for Tor), only when the request came through Cloudflare.
    country: text("country"),
  },
  (t) => [uniqueIndex("sessions_token_hash_idx").on(t.tokenHash), index("sessions_user_id_idx").on(t.userId)],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    key: text("key").notNull(),
    windowStart: at("window_start").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export const authEvents = pgTable(
  "auth_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    emailHash: text("email_hash").notNull(),
    type: text("type").notNull(),
    ipHash: text("ip_hash"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [index("auth_events_created_at_idx").on(t.createdAt)],
);
