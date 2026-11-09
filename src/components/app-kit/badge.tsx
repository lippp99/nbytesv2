import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

// Status color lives in the dot only; the word stays in text color, so contrast never depends on a tint.
const dot: Record<BadgeTone, string> = {
  neutral: "bg-app-text-3",
  accent: "bg-app-accent",
  success: "bg-app-success",
  warning: "bg-app-warning",
  danger: "bg-app-danger",
};

/** Small pill for a state or a tag. Status tones always show a dot and a word, never color alone. */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex h-6 items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-2.5 text-app-small text-app-text",
      tone === "accent" && "border-transparent bg-app-accent-soft text-app-accent-text",
      className,
    )}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
