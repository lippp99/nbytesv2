import "server-only";
import { eq } from "drizzle-orm";
import type { Profile } from "@/lib/auth/auth-contract";
import { db } from "../db/client";
import { users } from "../db/schema";
import { logAuthEvent } from "../auth/auth-events";
import { enforceLimit } from "../auth/rate-limit";
import { emailKey } from "../auth/request-guard";
import type { SessionUser } from "../auth/session";

const SAVES_PER_HOUR = 10; // PRD account-settings §5

/** Saves the signed-in user's own name. The row is the session's user, never an id from the request (IDOR). */
export async function updateProfile(user: SessionUser, profile: Profile, ipHash: string): Promise<Profile> {
  const who = { emailHash: emailKey(user.email), ipHash, userId: user.id };
  await enforceLimit(`profile-update:user:${user.id}`, SAVES_PER_HOUR, 3600, who);
  const { firstName, lastName } = profile; // only these two columns, whatever else the caller passed
  await db.update(users).set({ firstName, lastName }).where(eq(users.id, user.id));
  await logAuthEvent("profile_updated", who);
  return { firstName, lastName };
}
