import "server-only";
import { sql } from "drizzle-orm";
import {
  CONTACT_CHANNELS, type ContactSettings, EMPTY_CONTACTS, type VisibleContact, contactHref,
} from "@/lib/support/contact-contract";
import { logAdminEvent } from "../admin-auth/audit";
import { db } from "../db/client";
import { contactChannels } from "../db/schema";

// Admin contact (owner, 2026-11-12). No row yet = that channel is empty and hidden.

/** All three channels as the admin form edits them. */
export async function contactSettings(): Promise<ContactSettings> {
  const rows = await db.select().from(contactChannels);
  const out = { ...EMPTY_CONTACTS };
  for (const row of rows) out[row.channel] = { value: row.value, visible: row.visible };
  return out;
}

/** Only the switched-on channels, in a fixed order, with the link that opens each (user Contact page). */
export async function visibleContacts(): Promise<VisibleContact[]> {
  const settings = await contactSettings();
  return CONTACT_CHANNELS.filter((c) => settings[c].visible && settings[c].value)
    .map((channel) => ({ channel, value: settings[channel].value, href: contactHref(channel, settings[channel].value) }));
}

/** Upserts the three rows and writes one audit event, in one transaction. `input` comes from parseContactBody. */
export async function saveContacts(adminId: string, input: ContactSettings, ipHash: string): Promise<void> {
  const rows = CONTACT_CHANNELS.map((channel) => ({ channel, ...input[channel], updatedBy: adminId, updatedAt: new Date() }));
  await db.transaction(async (tx) => {
    await tx.insert(contactChannels).values(rows).onConflictDoUpdate({
      target: contactChannels.channel,
      set: {
        value: sql`excluded.value`, visible: sql`excluded.visible`,
        updatedBy: sql`excluded.updated_by`, updatedAt: sql`excluded.updated_at`,
      },
    });
    await logAdminEvent("contact_set", { adminId, ipHash }, {}, tx);
  });
}
