export type ThemeName = "light" | "dark";

/**
 * Switches the `dark` class on <html> in the same frame as the click, with every CSS transition paused for that
 * frame. Without the pause, each element with `transition-colors` would fade its colours for 150ms after a theme
 * change (measured on the landing page: hundreds of transitions per click). next-themes does the same pause, but only
 * inside its own effect, which runs after this class change. Call setTheme() afterwards to persist the choice.
 */
export function applyThemeNow(theme: ThemeName) {
  const root = document.documentElement;
  const pause = document.createElement("style");
  pause.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(pause);
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  // Force the new styles to compute while transitions are off, then let them back on.
  void window.getComputedStyle(document.body).color;
  requestAnimationFrame(() => pause.remove());
}
