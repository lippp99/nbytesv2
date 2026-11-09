import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminFooter } from "@/components/admin/shell/admin-footer";
import { AdminHeader } from "@/components/admin/shell/admin-header";
import { AdminSidebar } from "@/components/admin/shell/admin-sidebar";
import { sidebarBootScript } from "@/lib/sidebar-state";

export const metadata: Metadata = { robots: { index: false } };

// Folds from 256px to a 64px rail on desktop (`rail:` variant); z-40 keeps the rail tooltips above page content.
const sidebar =
  "sticky top-0 z-40 hidden h-dvh w-64 shrink-0 border-r border-app-border transition-[width] duration-200 ease-out " +
  "motion-reduce:transition-none lg:block rail:w-16";

// Route group: the admin pages share this frame; /admin/login stays outside it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // data-app switches on the dashboard tokens in globals.css (html:has([data-app])).
    <div data-app className="flex min-h-dvh flex-1 bg-app-page text-app-text">
      {/* restores a folded sidebar before first paint; static string, no user input */}
      <script dangerouslySetInnerHTML={{ __html: sidebarBootScript }} />
      <aside id="admin-sidebar" className={sidebar}>
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-app">{children}</div>
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
