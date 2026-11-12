import type { ComponentType, ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { IconProps } from "@/components/icons/two-tone-icon";
import { cn } from "@/lib/utils";

/** A Hugeicons icon, or one of the owner's two-tone icon components (e.g. StatisticsIcon). */
type EmptyStateProps = {
  icon: IconSvgElement | ComponentType<IconProps>; title: string; body: string; action?: ReactNode; className?: string;
  /** danger: something failed (not just empty): red icon on the inset well, announced as an alert. */
  tone?: "default" | "danger";
};

/** What goes here and the one step that fills it; never just "nothing here". */
export function EmptyState({ icon: Icon, title, body, action, className, tone = "default" }: EmptyStateProps) {
  const danger = tone === "danger";
  return (
    <div role={danger ? "alert" : undefined} className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span aria-hidden className={cn("grid size-10 place-items-center rounded-app-control",
        danger ? "bg-app-inset text-app-danger" : "bg-app-accent-soft text-app-accent-text")}>
        {typeof Icon === "function" ? <Icon className="size-5" /> : <HugeiconsIcon icon={Icon} className="size-5" />}
      </span>
      <h3 className="mt-4 text-app-card text-app-text">{title}</h3>
      <p className="mt-1 max-w-sm text-app-ui text-app-text-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
