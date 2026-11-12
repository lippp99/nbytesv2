import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { admins } from "./admin";

// Admin contact shown on the user's Contact page (owner, 2026-11-12). One row per channel, updated in place;
// every save is in admin_audit_events (contact_set). Values are normalized by lib/contact-contract.
export const contactChannels = pgTable(
  "contact_channels",
  {
    channel: text("channel", { enum: ["whatsapp", "telegram", "email"] }).primaryKey(),
    value: text("value").notNull().default(""),
    visible: boolean("visible").notNull().default(false),
    updatedBy: uuid("updated_by").references(() => admins.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("contact_channels_channel_check", sql`${t.channel} in ('whatsapp', 'telegram', 'email')`),
    // a shown channel always has something to show
    check("contact_channels_visible_check", sql`not ${t.visible} or ${t.value} <> ''`),
  ],
);
