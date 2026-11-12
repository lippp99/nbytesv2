import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { AdminAccount } from "@/components/admin/shell/admin-account";
import { AdminFooter } from "@/components/admin/shell/admin-footer";
import { AdminHeader } from "@/components/admin/shell/admin-header";
import { AdminSidebar } from "@/components/admin/shell/admin-sidebar";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { robots: { index: false } };

// Folds from 256px to a 64px rail on desktop (`rail:` variant); z-40 keeps the rail tooltips above page content.
const sidebar =
  "sticky top-0 z-40 hidden h-dvh w-64 shrink-0 border-r border-app-border transition-[width] duration-200 ease-out " +
  "motion-reduce:transition-none lg:block rail:w-16";

/**
 * Database session check (PRD backend-auth-admin §10; the proxy only sees the cookie): no valid session ->
 * /admin/login. Renders nothing, like the dashboard's SessionGate. Next renders layout and page in parallel, so this
 * redirects but does not keep a page's own output out of the response (checked 2026-11-11): any page that loads real
 * data must call getCurrentAdmin itself next to that data.
 */
async function SessionGate() {
  await getCurrentAdmin();
  return null;
}

/** The signed-in Owner in the sidebar; nothing without a session (SessionGate does the redirect). */
async function Account() {
  const session = await readAdminSession();
  return session ? <AdminAccount me={session.admin} /> : null;
}

// Route group: the admin pages share this frame; /admin/login stays outside it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  // Reading the session must sit behind <Suspense> with Cache Components (docs: authentication-with-cache-components).
  const account = <Suspense fallback={null}><Account /></Suspense>;
  return (
    // data-app switches on the dashboard tokens in globals.css (html:has([data-app])).
    <div data-app className="flex min-h-dvh flex-1 bg-app-page text-app-text">
      <Suspense fallback={null}>
        <SessionGate />
      </Suspense>
      <aside id="admin-sidebar" className={sidebar}>
        <AdminSidebar account={account} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader account={account} />
        <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-app">{children}</div>
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
