"use client";

import { useEffect, useSyncExternalStore } from "react";
import { iconAction } from "@/components/app-kit/button";
import { isCollapsed, setCollapsed, subscribeSidebar } from "@/lib/sidebar-state";
import { SidebarIcon } from "@/components/icons/ui/sidebar";
import { shellCopy } from "./shell-copy";

/** Desktop-only button (and Ctrl/Cmd+B) that folds the admin sidebar to an icon rail and back. */
export function AdminSidebarToggle() {
  const collapsed = useSyncExternalStore(subscribeSidebar, isCollapsed, () => false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "b" || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      e.preventDefault();
      setCollapsed(!isCollapsed());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const label = collapsed ? shellCopy.openSidebar : shellCopy.closeSidebar;
  return (
    <button type="button" onClick={() => setCollapsed(!collapsed)} aria-controls="admin-sidebar" aria-expanded={!collapsed}
      aria-label={label} title={`${label} (Ctrl+B)`} className={iconAction("-ml-2 hidden lg:inline-flex")}>
      <SidebarIcon className="size-5!" />
    </button>
  );
}
