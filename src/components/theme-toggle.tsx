"use client";

import { type MouseEvent, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { focusRing } from "@/components/button-styles";
import { MoonIcon, SunIcon } from "@/components/theme-icons";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/** Puts the theme class on <html> right away; next-themes only applies it in an effect after its state update. */
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/**
 * Light/dark switch for the header. The first visit follows the system setting (ThemeProvider defaultTheme="system");
 * a click picks light or dark explicitly. Where the View Transitions API exists, the new theme grows out of the
 * button as a circle; otherwise, and with reduced motion, it switches at once.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const next = dark ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      applyTheme(next);
      setTheme(next);
      return;
    }
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    // freeze CSS transitions while the new state is captured, or buttons would be snapshotted in their old colours
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none!important}";
    const transition = document.startViewTransition(() => {
      document.head.appendChild(freeze);
      applyTheme(next);
    });
    setTheme(next);
    transition.finished.finally(() => freeze.remove());
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Mode gelap"
      aria-pressed={mounted ? dark : undefined}
      className={cn(
        "relative grid size-9 place-items-center overflow-hidden border border-border text-foreground/80",
        "transition-colors duration-150 hover:bg-muted hover:text-foreground",
        focusRing,
        className,
      )}
    >
      {/* both icons are always rendered; the .dark class decides which one is in view, so there is no hydration flash */}
      <SunIcon aria-hidden className="theme-icon theme-icon-sun size-5" />
      <MoonIcon aria-hidden className="theme-icon theme-icon-moon size-5" />
    </button>
  );
}
