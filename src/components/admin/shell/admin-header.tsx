"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/app-kit/badge";
import { ThemeSwitch } from "@/components/app-kit/theme-switch";
import { activeAdminItem } from "./admin-nav";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";
import { AdminSidebarToggle } from "./admin-sidebar-toggle";
import { shellCopy } from "./shell-copy";

/** Sticky bar: menu (mobile), current page, the demo-data notice and the theme switch. */
export function AdminHeader() {
  const page = activeAdminItem(usePathname());
  return (
    <header className="sticky top-0 z-30 border-b border-app-border bg-app-surface">
      <div className="flex h-16 items-center gap-3 px-5 lg:px-10">
        <AdminSidebarToggle />
        <AdminMobileNav>
          <AdminSidebar />
        </AdminMobileNav>
        <p className="min-w-0 truncate text-app-ui font-medium text-app-text">{page?.label}</p>
        <div className="ml-auto flex items-center gap-2">
          <span title={shellCopy.demoTitle}>
            <Badge tone="warning">{shellCopy.demo}</Badge>
          </span>
          <ThemeSwitch label={shellCopy.darkMode} />
        </div>
      </div>
    </header>
  );
}
