import { cn } from "@/lib/utils";

/** Dashboard focus ring: 2px accent outline, offset so it never hides the control's own border. */
export const appFocus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent";

// Buttons share the control radius (10px) and height; accent fill is reserved for the one primary action per view.
const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-app-control font-medium whitespace-nowrap select-none " +
  "transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress " +
  `[&_svg]:size-4 [&_svg]:shrink-0 ${appFocus}`;
const size = { md: "h-10 px-4 text-app-ui", sm: "h-8 px-3 text-app-small" };

type Size = keyof typeof size;

/** The view's main action: accent fill, white label (5.18:1). */
export function primaryAction(className?: string, s: Size = "md") {
  return cn(base, size[s], "bg-app-accent text-app-on-accent hover:bg-app-accent/90 active:bg-app-accent/80", className);
}

/** Any other action: surface with a control outline. */
export function secondaryAction(className?: string, s: Size = "md") {
  return cn(base, size[s], "border border-app-border bg-app-surface text-app-text hover:bg-app-hover active:bg-app-hover/70", className);
}

/** Quiet action in toolbars, rows and headers. */
export function ghostAction(className?: string, s: Size = "md") {
  return cn(base, size[s], "text-app-text-2 hover:bg-app-hover hover:text-app-text active:bg-app-hover/70", className);
}

/** Destructive confirmation, used only after the user asked for it. */
export function dangerAction(className?: string, s: Size = "md") {
  return cn(base, size[s], "border border-app-danger/40 bg-app-surface text-app-danger hover:bg-app-danger/10", className);
}

/** Square icon-only button; give it an aria-label. */
export function iconAction(className?: string) {
  return cn(base, "size-9 text-app-text-2 hover:bg-app-hover hover:text-app-text", className);
}
