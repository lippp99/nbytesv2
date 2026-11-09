import {
  Analytics01Icon,
  BookOpen01Icon,
  CommandLineIcon,
  CreditCardIcon,
  CubeIcon,
  Key01Icon,
  LaptopPhoneSyncIcon,
  Rocket01Icon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavItem = { href: string; label: string; icon: IconSvgElement };
// Group icons: a name, mapped to the owner's two-tone icons in sidebar-rail.tsx (keeps this module JSX-free for
// node tests). Item icons are not drawn anywhere yet.
export type NavGroupIcon = "rocket" | "apps" | "profile";
export type NavGroup = { label: string; icon: NavGroupIcon; items: NavItem[] };

// Menu names as the owner wrote them. Routes live in the (dashboard) route group, so URLs have no /dashboard prefix.
// Each group is one icon in the sidebar rail; its items are listed in the panel beside it.
export const navGroups: NavGroup[] = [
  {
    label: "Mulai",
    icon: "rocket",
    items: [
      { href: "/quick-start", label: "Quick start", icon: Rocket01Icon },
      { href: "/playground", label: "Playground", icon: CommandLineIcon },
      { href: "/docs", label: "API Docs", icon: BookOpen01Icon },
    ],
  },
  {
    label: "Kelola",
    icon: "apps",
    items: [
      { href: "/usage", label: "Usage", icon: Analytics01Icon },
      { href: "/api-keys", label: "API Keys", icon: Key01Icon },
      { href: "/models", label: "Models", icon: CubeIcon },
      { href: "/billing", label: "Billing", icon: CreditCardIcon },
    ],
  },
  {
    label: "Akun",
    icon: "profile",
    items: [
      { href: "/settings", label: "Account Settings", icon: UserSettings01Icon },
      { href: "/sessions", label: "Active Sessions", icon: LaptopPhoneSyncIcon },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items);

/** An item matches its own page and anything below it, never a look-alike prefix (/api-keys vs /api-keys-old). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeItem(pathname: string): NavItem | undefined {
  return allItems.find((item) => isActive(pathname, item.href));
}

/** The group holding the current page, so the rail opens on it; the first group when no item matches. */
export function groupIndexOf(pathname: string): number {
  const index = navGroups.findIndex((group) => group.items.some((item) => isActive(pathname, item.href)));
  return Math.max(0, index);
}
