import { type ReactNode, Suspense } from "react";
import { AppFooter } from "@/components/dashboard/shell/app-footer";
import { AppHeader } from "@/components/dashboard/shell/app-header";
import { Sidebar } from "@/components/dashboard/shell/sidebar/sidebar";
import { sidebarBootScript } from "@/lib/sidebar-state";
import { getCurrentUser } from "@/lib/server/auth/current-user";

// Folds from 256px to a 64px rail on desktop (`rail:` variant); z-40 keeps the rail tooltips above page content.
const sidebar =
  "sticky top-0 z-40 hidden h-dvh w-64 shrink-0 border-r border-app-border transition-[width] duration-200 ease-out " +
  "motion-reduce:transition-none lg:block rail:w-16";

/** Database session check (the proxy only sees the cookie): no valid session -> /login. Renders nothing. */
async function SessionGate() {
  await getCurrentUser();
  return null;
}

// Route group: the dashboard pages share this frame but keep short URLs (/playground, not /dashboard/playground).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // data-app switches on the dashboard tokens in globals.css (html:has([data-app])); the landing never has it.
    <div data-app className="flex min-h-dvh flex-1 bg-app-page text-app-text">
      {/* restores a folded sidebar before first paint; static string, no user input */}
      <script dangerouslySetInnerHTML={{ __html: sidebarBootScript }} />
      <Suspense fallback={null}>
        <SessionGate />
      </Suspense>
      <aside id="app-sidebar" className={sidebar}>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-app">{children}</div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
