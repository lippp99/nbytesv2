"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { focusRing } from "@/components/button-styles";
import { MoonIcon, SunIcon } from "@/components/theme-icons";
import { applyThemeNow } from "@/lib/apply-theme";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/**
 * Light/dark switch for the landing header. The first visit follows the system setting (ThemeProvider
 * defaultTheme="system"); a click picks light or dark and applies it at once, with no reveal or icon animation
 * (owner decision 2026-11-08: the 600ms circle made switching feel slow). applyThemeNow sets the class in the click
 * frame with transitions paused; next-themes then persists the choice.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  function toggle() {
    const next = dark ? "light" : "dark";
    applyThemeNow(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Mode gelap"
      aria-pressed={mounted ? dark : undefined}
      className={cn(
        "grid size-9 place-items-center rounded-chip text-foreground/80",
        "transition-colors duration-150 hover:bg-muted hover:text-foreground",
        focusRing,
        className,
      )}
    >
      {/* the .dark class picks the icon, so the right one shows before hydration too */}
      <SunIcon aria-hidden className="size-5 dark:hidden" />
      <MoonIcon aria-hidden className="hidden size-5 dark:block" />
    </button>
  );
}
