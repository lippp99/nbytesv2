import {
  Analytics01Icon,
  BookOpen01Icon,
  CommandLineIcon,
  CreditCardIcon,
  CubeIcon,
  Key01Icon,
  Rocket01Icon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavItem = { href: string; label: string; icon: IconSvgElement };

// Menu names as the owner wrote them. Routes live in the (dashboard) route group, so URLs have no /dashboard prefix.
export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Mulai",
    items: [
      { href: "/quick-start", label: "Quick start", icon: Rocket01Icon },
      { href: "/playground", label: "Playground", icon: CommandLineIcon },
      { href: "/docs", label: "API Docs", icon: BookOpen01Icon },
    ],
  },
  {
    label: "Kelola",
    items: [
      { href: "/usage", label: "Usage", icon: Analytics01Icon },
      { href: "/api-keys", label: "API Keys", icon: Key01Icon },
      { href: "/models", label: "Models", icon: CubeIcon },
      { href: "/billing", label: "Billing", icon: CreditCardIcon },
    ],
  },
  {
    label: "Akun",
    items: [{ href: "/settings", label: "Account Settings", icon: UserSettings01Icon }],
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
