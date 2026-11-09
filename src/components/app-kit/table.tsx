import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Align = "left" | "right";
type CellProps = { children?: ReactNode; align?: Align; className?: string };

/** Data table: 48px rows, hairline dividers, numbers right-aligned in tabular figures, scrolls sideways when narrow. */
export function Table({ children, minWidth = "min-w-2xl", className }: { children: ReactNode; minWidth?: string; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-app-ui text-app-text [&_tbody_tr:last-child]:border-b-0", minWidth, className)}>{children}</table>
    </div>
  );
}

export function Th({ children, align = "left", className }: CellProps) {
  return (
    <th scope="col" className={cn("h-11 px-4 text-app-small font-medium text-app-text-3 first:pl-6 last:pr-6",
      align === "right" ? "text-right" : "text-left", className)}>
      {children}
    </th>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-b border-app-border transition-colors hover:bg-app-hover/60", className)}>{children}</tr>;
}

export function Td({ children, align = "left", className }: CellProps) {
  return (
    <td className={cn("h-12 px-4 first:pl-6 last:pr-6", align === "right" && "text-right font-mono text-app-code tabular-nums", className)}>
      {children}
    </td>
  );
}

/** Header row with the divider under it. */
export function THead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("border-b border-app-border", className)}><tr>{children}</tr></thead>;
}
