"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { cn } from "@/lib/utils";
import { isActive, navGroups } from "./nav-items";
import { shellCopy } from "./shell-copy";

// Active: soft orange plate, orange icon and a 2px orange rail on the left edge of the sidebar.
const linkBase =
  "relative flex h-9 items-center gap-3 rounded-chip px-3 text-sm transition-colors duration-150 " +
  "before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-accent-mark before:opacity-0";
const linkActive = "bg-accent-soft font-medium text-foreground before:opacity-100 [&_svg]:text-accent-ink";
const linkIdle = "text-muted-foreground hover:bg-muted hover:text-foreground";

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={shellCopy.navLabel} className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-label uppercase text-faint">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(linkBase, active ? linkActive : linkIdle, focusRing)}
                  >
                    <HugeiconsIcon icon={item.icon} aria-hidden className="size-4.5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
