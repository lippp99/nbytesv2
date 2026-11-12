import "server-only";
import { cache } from "react";
import { sql } from "drizzle-orm";
import {
  ADMIN_SESSION_HOURS, type AdminSessionHours, DEFAULT_PLATFORM_SETTINGS, type PlatformSettings,
} from "@/lib/platform/platform-settings-contract";
import { logAdminEvent } from "../admin-auth/audit";
import { db } from "../db/client";
import { platformSettings } from "../db/schema";

// Platform settings (owner, 2026-11-12): sign-up, maintenance, API key rate limit, admin session length.

/**
 * The settings in force: the one row, or the defaults before the first save. React `cache()` shares one read per
 * render; route handlers (API, login) are not a render pass, so there it reads on every call and a change applies at once.
 */
export const currentPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  const [row] = await db.select().from(platformSettings).limit(1);
  if (!row) return DEFAULT_PLATFORM_SETTINGS;
  const hours = ADMIN_SESSION_HOURS.includes(row.adminSessionHours as AdminSessionHours)
    ? (row.adminSessionHours as AdminSessionHours)
    : DEFAULT_PLATFORM_SETTINGS.adminSessionHours; // the table check allows only 4, 8, 12; this only satisfies the type
  return { signupOpen: row.signupOpen, maintenance: row.maintenance, banner: row.banner, keyRpm: row.keyRpm, adminSessionHours: hours };
});

/** Writes the one row and one audit event in one transaction. `input` comes from parseSettingsBody. */
export async function savePlatformSettings(adminId: string, input: PlatformSettings, ipHash: string): Promise<void> {
  const row = { id: 1, ...input, updatedBy: adminId, updatedAt: new Date() };
  await db.transaction(async (tx) => {
    await tx.insert(platformSettings).values(row).onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        signupOpen: sql`excluded.signup_open`, maintenance: sql`excluded.maintenance`, banner: sql`excluded.banner`,
        keyRpm: sql`excluded.key_rpm`, adminSessionHours: sql`excluded.admin_session_hours`,
        updatedBy: sql`excluded.updated_by`, updatedAt: sql`excluded.updated_at`,
      },
    });
    await logAdminEvent("settings_set", { adminId, ipHash }, {}, tx);
  });
}
