"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/app-kit/theme-switch";
import { activeAdminItem } from "./admin-nav";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";
import { AdminSidebarToggle } from "./admin-sidebar-toggle";
import { shellCopy } from "./shell-copy";

/** Sticky bar: menu (mobile), current page and the theme switch. */
export function AdminHeader({ account }: { account: ReactNode }) {
  const page = activeAdminItem(usePathname());
  return (
    <header className="sticky top-0 z-30 border-b border-app-border bg-app-surface">
      <div className="flex h-16 items-center gap-3 px-5 lg:px-10">
        <AdminSidebarToggle />
        <AdminMobileNav>
          <AdminSidebar account={account} />
        </AdminMobileNav>
        <p className="min-w-0 truncate text-app-ui font-medium text-app-text">{page?.label}</p>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch label={shellCopy.darkMode} />
        </div>
      </div>
    </header>
  );
}
