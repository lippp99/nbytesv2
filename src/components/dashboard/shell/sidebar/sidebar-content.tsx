"use client";

import { type ReactNode, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { groupIndexOf } from "../nav-items";
import { SidebarNav } from "./sidebar-nav";
import { SidebarRail } from "./sidebar-rail";
import { isCollapsed, setCollapsed } from "@/lib/sidebar-state";

const desktop = "(width >= 64rem)";

/**
 * Everything inside the sidebar, in two tiers: a rail of group icons and a panel with the open group's pages.
 * The desktop sidebar (folded to the rail by the `rail:` variant) and the mobile drawer render the same.
 * `user` and `avatar` are the signed-in user's parts, rendered on the server (sidebar.tsx); `counts` come from the layout.
 */
type SidebarContentProps = { user: ReactNode; avatar: ReactNode; counts: Record<string, ReactNode> };

export function SidebarContent({ user, avatar, counts }: SidebarContentProps) {
  const pathname = usePathname();
  const panelId = useId();
  // A picked group holds only on the page it was picked on; moving to another page opens that page's group.
  const [picked, setPicked] = useState<{ path: string; group: number } | null>(null);
  const group = picked?.path === pathname ? picked.group : groupIndexOf(pathname);

  function pick(index: number) {
    setPicked({ path: pathname, group: index });
    // On the folded desktop rail a group has nowhere to show its pages, so choosing one unfolds the panel.
    if (window.matchMedia(desktop).matches && isCollapsed()) setCollapsed(false);
  }

  return (
    <div className="flex h-full bg-app-page">
      <SidebarRail group={group} panelId={panelId} onPick={pick} avatar={avatar} />
      <div className="flex min-w-0 flex-1 flex-col border-l border-app-border rail:hidden">
        <SidebarNav group={group} id={panelId} pathname={pathname} counts={counts} />
        {user}
      </div>
    </div>
  );
}
