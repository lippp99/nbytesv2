"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/app-kit/badge";
import { appFocus, iconAction } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";
import monogram from "../../../../public/brand/nb-orange.png";
import { LogoutIcon } from "@/components/icons/ui/logout";
import { adminNav, isAdminActive } from "./admin-nav";
import { shellCopy } from "./shell-copy";

const link =
  "group relative flex h-9 items-center gap-3 rounded-app-control px-3 text-app-ui transition-colors duration-150 " +
  `[&_svg]:size-5 [&_svg]:shrink-0 rail:justify-center rail:px-0 ${appFocus}`;
// Current page: the raised chip of the dashboard panel (surface, hairline ring, small shadow, bold ink label).
const active = "bg-app-surface font-semibold text-app-text shadow-app-raised ring-1 ring-app-border";
const idle = "text-app-text-2 hover:bg-app-hover hover:text-app-text";
// Folded to icons, every item names itself on hover and keyboard focus (same tooltip as the dashboard rail).
const tip =
  "pointer-events-none absolute top-1/2 left-full z-50 ml-3 hidden -translate-y-1/2 rounded-app-inner bg-app-text px-2 py-1 " +
  "text-app-small font-normal whitespace-nowrap text-app-surface shadow-app-raised rail:group-hover:block rail:group-focus-visible:block";

/**
 * Admin sidebar: brand with "Admin" tag, grouped menus, the signed-in admin and sign-out. On desktop it folds to a
 * 64px icon rail (`rail:` variant, shared state in lib/sidebar-state); the mobile drawer always shows it in full.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const me = shellCopy.me;
  return (
    <div className="flex h-full flex-col bg-app-page">
      <Link href="/admin" aria-label={shellCopy.home}
        className={cn("mx-3 flex h-16 shrink-0 items-center gap-2.5 px-3 rail:justify-center rail:px-0", appFocus)}>
        <Image src={monogram} alt="" sizes="28px" className="size-7" />
        <Badge tone="accent" className="rail:hidden">{shellCopy.admin}</Badge>
      </Link>
      <nav aria-label={shellCopy.navLabel} className="flex-1 space-y-6 overflow-y-auto px-3 pt-2 pb-4 rail:space-y-3 rail:overflow-visible">
        {adminNav.map((group) => (
          <div key={group.label} className="rail:border-t rail:border-app-border rail:pt-3 rail:first:border-t-0 rail:first:pt-0">
            <h2 className="px-3 pb-1.5 text-app-small font-medium text-app-text-3 rail:sr-only">{group.label}</h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const on = isAdminActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={on ? "page" : undefined} className={cn(link, on ? active : idle)}>
                      <item.icon className={on ? "text-app-accent-text" : undefined} />
                      <span className="truncate rail:sr-only">{item.label}</span>
                      <span aria-hidden className={tip}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-1 border-t border-app-border p-3 rail:justify-center">
        <div className="min-w-0 flex-1 px-3 py-1 leading-tight rail:hidden">
          <span className="block truncate text-app-ui text-app-text">{me.name}</span>
          <span className="block truncate text-app-small text-app-text-3">{me.role} · {me.email}</span>
        </div>
        <Link href="/admin/login" aria-label={shellCopy.signOut} title={shellCopy.signOut} className={iconAction()}>
          <LogoutIcon className="size-5!" />
        </Link>
      </div>
    </div>
  );
}
