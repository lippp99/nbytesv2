import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NEXT_PATH_HEADER, safeNextPath } from "@/lib/auth/auth-contract";
import { readSession, type SessionUser } from "./session";

/**
 * Data Access Layer for pages: the signed-in user (narrow DTO), or a redirect to /login?next=<page> when the cookie
 * is there but the session is not (expired, idle, logged out elsewhere, suspended). Not cached on purpose.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await readSession();
  if (session) return session.user;
  const next = safeNextPath((await headers()).get(NEXT_PATH_HEADER));
  redirect(next ? `/login?${new URLSearchParams({ next })}` : "/login");
}
