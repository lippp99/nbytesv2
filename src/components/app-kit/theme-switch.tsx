"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@/components/theme-icons";
import { applyThemeNow } from "@/lib/apply-theme";
import { cn } from "@/lib/utils";
import { iconAction } from "./button";

const subscribe = () => () => {};

/**
 * Dashboard light/dark switch: the theme changes on the click, with no reveal and no icon animation (owner decision
 * 2026-11-08). applyThemeNow sets the class in the click frame with transitions paused; next-themes then persists it.
 */
export function ThemeSwitch({ label, className }: { label: string; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  function toggle() {
    const next = dark ? "light" : "dark";
    applyThemeNow(next);
    setTheme(next);
  }

  return (
    <button type="button" onClick={toggle} aria-label={label} aria-pressed={mounted ? dark : undefined} className={cn(iconAction(), className)}>
      {/* the .dark class picks the icon, so the right one shows before hydration too */}
      <SunIcon aria-hidden className="size-5! dark:hidden" />
      <MoonIcon aria-hidden className="hidden size-5! dark:block" />
    </button>
  );
}
