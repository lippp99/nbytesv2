import type { ReactNode } from "react";
import { AppFooter } from "@/components/dashboard/shell/app-footer";
import { AppHeader } from "@/components/dashboard/shell/app-header";
import { SidebarContent } from "@/components/dashboard/shell/sidebar-content";

// Route group: the dashboard pages share this frame but keep short URLs (/playground, not /dashboard/playground).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border lg:block">
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
