import type { ComponentType } from "react";
import type { IconProps } from "@/components/icons/two-tone-icon";
import { AppsIcon } from "@/components/icons/content/apps";
import { CardCheckIcon } from "@/components/icons/content/card-check";
import { CubeIcon } from "@/components/icons/content/cube";
import { DocumentFoldedIcon } from "@/components/admin/shared/icons/document-folded";
import { LineChartIcon } from "@/components/icons/content/line-chart";
import { ProfileIcon } from "@/components/icons/content/profile";
import { ServerIcon } from "@/components/admin/shared/icons/server";
import { SettingsIcon } from "@/components/icons/content/settings";
import { UserGroupIcon } from "@/components/admin/shared/icons/user-group";

export type AdminNavItem = { href: string; label: string; icon: ComponentType<IconProps> };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

// Menus from PRD backend-auth-admin A.7, grouped by what the admin does: watch, manage, secure.
// Icons: the owner's two-tone set (admin/shared/icons/, shared ones in components/icons/).
export const adminNav: AdminNavGroup[] = [
  {
    label: "Monitor",
    items: [
      { href: "/admin", label: "Overview", icon: AppsIcon },
      { href: "/admin/requests", label: "Request log", icon: LineChartIcon },
      { href: "/admin/upstream", label: "Upstream", icon: ServerIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/users", label: "Users", icon: UserGroupIcon },
      { href: "/admin/models", label: "Models & pricing", icon: CubeIcon },
      { href: "/admin/billing", label: "Billing", icon: CardCheckIcon },
      { href: "/admin/contact", label: "Contact", icon: ProfileIcon },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/admin/audit", label: "Audit log", icon: DocumentFoldedIcon },
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

/** `/admin` (overview) matches only itself; other items also match their sub-pages, never a look-alike prefix. */
export function isAdminActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeAdminItem(pathname: string): AdminNavItem | undefined {
  return adminNav.flatMap((g) => g.items).find((item) => isAdminActive(pathname, item.href));
}
