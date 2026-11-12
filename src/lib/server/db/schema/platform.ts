import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { admins } from "./admin";

// Platform settings from the admin Settings page (owner, 2026-11-12). One row (id 1), updated in place; every save is
// in admin_audit_events (settings_set). No row yet = DEFAULT_PLATFORM_SETTINGS in lib/platform.
export const platformSettings = pgTable(
  "platform_settings",
  {
    id: smallint("id").primaryKey().default(1),
    signupOpen: boolean("signup_open").notNull(),
    maintenance: boolean("maintenance").notNull(),
    banner: text("banner").notNull().default(""),
    keyRpm: integer("key_rpm").notNull(),
    adminSessionHours: smallint("admin_session_hours").notNull(),
    updatedBy: uuid("updated_by").references(() => admins.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("platform_settings_single_row_check", sql`${t.id} = 1`),
    check("platform_settings_values_check", sql`${t.keyRpm} between 1 and 10000 and ${t.adminSessionHours} in (4, 8, 12)`),
    check("platform_settings_banner_check", sql`not ${t.maintenance} or ${t.banner} <> ''`),
  ],
);
