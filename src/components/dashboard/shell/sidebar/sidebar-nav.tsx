import type { ReactNode } from "react";
import Link from "next/link";
import { appFocus } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";
import { isActive, navGroups } from "../nav-items";


const link =
  `flex h-9 items-center gap-3 rounded-app-control px-3 text-app-ui transition-colors duration-150 ${appFocus}`;
// Current page: a raised chip (surface, hairline ring, small shadow) with a bold ink label, so it reads clearly
// without repeating the rail's solid accent tile and without a faded plate.
const active = "bg-app-surface font-semibold text-app-text shadow-app-raised ring-1 ring-app-border";
const idle = "text-app-text-2 hover:bg-app-hover hover:text-app-text";

/** `counts`: numbers beside items (href -> slot), read on the server by the layout and passed down. */
type SidebarNavProps = { group: number; id: string; pathname: string; counts: Record<string, ReactNode> };

/** Second tier: the open group's name and its pages. Hidden while the sidebar is folded to the rail. */
export function SidebarNav({ group, id, pathname, counts }: SidebarNavProps) {
  const current = navGroups[group];
  return (
    <nav id={id} aria-label={current.label} className="flex-1 overflow-y-auto px-3 pb-4">
      <p aria-hidden className="flex h-16 items-center px-3 text-app-card text-app-text">{current.label}</p>
      <ul className="space-y-0.5">
        {current.items.map((item) => {
          const on = isActive(pathname, item.href);
          const count = counts[item.href];
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={on ? "page" : undefined} className={cn(link, on ? active : idle)}>
                <span className="truncate">{item.label}</span>
                {count !== undefined && (
                  <span className={cn("ml-auto font-mono text-app-small tabular-nums", on ? "text-app-accent-text" : "text-app-text-3")}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
