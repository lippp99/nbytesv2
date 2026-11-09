import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { appFocus } from "./button";

type Option<T extends string> = { value: T; label: ReactNode };
type SegmentedProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

const item =
  `h-8 rounded-app-inner px-3 text-app-small font-medium text-app-text-2 transition-colors duration-150 ${appFocus} ` +
  "hover:text-app-text aria-pressed:bg-app-surface aria-pressed:text-app-text aria-pressed:ring-1 aria-pressed:ring-app-border";

/** A few mutually exclusive choices that change what is shown in place (language, view). Use tabs for page sections. */
export function Segmented<T extends string>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex gap-1 rounded-app-control border border-app-border bg-app-inset p-1", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} className={item}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
