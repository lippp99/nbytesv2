import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Visible 2px ink outline for custom interactive elements. */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Button looks layered on the shadcn button so ui/ stays untouched.
const base =
  "h-10.5 px-4.5 text-sm font-medium gap-1.5 rounded-none transition-[box-shadow,transform,background-color,color] " +
  "duration-150 ease-out-quint focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background focus-visible:border-transparent active:not-aria-[haspopup]:translate-y-0 " +
  "disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:transition-transform [&_svg]:duration-150 hover:[&_svg]:translate-x-0.5 " +
  "[&_svg:not([class*=size-])]:size-3";

/** Ink block with a solid orange offset shadow; the button "presses" into the shadow. */
export function primaryButton(className?: string) {
  return cn(
    buttonVariants(),
    base,
    "bg-primary text-primary-foreground hover:bg-primary shadow-press hover:shadow-press-hover",
    "active:shadow-none active:translate-x-0.75 active:not-aria-[haspopup]:translate-y-0.75 disabled:shadow-none",
    className,
  );
}

/** Flat grey plate button for the second action next to a primary one. */
export function secondaryButton(className?: string) {
  return cn(buttonVariants({ variant: "secondary" }), base, "bg-secondary text-foreground hover:bg-guide", className);
}

/** Hairline outline, used in the header and on plates where a grey fill would disappear. */
export function outlineButton(className?: string) {
  return cn(buttonVariants({ variant: "outline" }), base, "border-border bg-transparent hover:bg-muted dark:bg-transparent", className);
}

/** Underlined text link, thicker underline on hover. */
export const textLink = `underline decoration-1 underline-offset-4 hover:decoration-2 rounded-sm ${focusRing}`;
