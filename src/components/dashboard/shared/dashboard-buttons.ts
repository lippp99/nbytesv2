import { focusRing } from "@/components/button-styles";
import { cn } from "@/lib/utils";

// The dashboard's own button set (not the landing page's): flat pills, accent only on the one primary action.
const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium whitespace-nowrap " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 " +
  `[&_svg]:size-4 [&_svg]:shrink-0 ${focusRing}`;

/** Primary action: nb-orange fill, white label (5.2:1). One per view. */
export function primaryAction(className?: string) {
  return cn(base, "h-10 bg-accent-mark px-4 text-accent-mark-foreground hover:bg-accent-mark/90 active:bg-accent-mark/80", className);
}

/** Secondary action: hairline border on the surface. */
export function secondaryAction(className?: string) {
  return cn(base, "h-10 border border-border bg-background px-4 text-foreground hover:bg-muted active:bg-muted/70", className);
}

/** Quiet action in toolbars and table rows. */
export function ghostAction(className?: string) {
  return cn(base, "h-9 px-3 text-muted-foreground hover:bg-muted hover:text-foreground", className);
}
