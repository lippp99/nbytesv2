import "server-only";
import { redirect } from "next/navigation";
import type { AdminMe } from "@/lib/admin-auth/admin-auth-contract";
import { readAdminSession } from "./admin-session";

/**
 * DAL for admin pages (PRD §10): the signed-in Owner, or a redirect to /admin/login. Read behind <Suspense>.
 * Admin Route Handlers that come later check readAdminSession() themselves before validating input.
 */
export async function getCurrentAdmin(): Promise<AdminMe> {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");
  return session.admin;
}
