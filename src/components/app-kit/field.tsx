import type { ComponentProps, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

/** Native control look: 40px, 10px radius, 3:1 outline, accent focus, danger when aria-invalid, inset when disabled. */
export const controlStyles =
  "w-full rounded-app-control border border-app-border-strong bg-app-surface px-3 text-app-ui text-app-text outline-none " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-app-text-3 hover:border-app-text-3 " +
  "focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20 " +
  "aria-invalid:border-app-danger aria-invalid:focus-visible:ring-app-danger/20 " +
  "disabled:cursor-not-allowed disabled:border-app-border disabled:bg-app-inset disabled:text-app-text-3";

/** ids for aria-describedby: the error wins over the hint. */
export function describedBy(id: string, { hint, error }: { hint?: string; error?: string | null }) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type FieldProps = { id: string; label: string; hint?: string; error?: string | null; aside?: ReactNode; children: ReactNode };

/** Label above, control, then the hint or the error that belongs to this field. */
export function Field({ id, label, hint, error, aside, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-app-ui font-medium text-app-text">{label}</label>
        {aside}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-app-small text-app-danger">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-app-small text-app-text-3">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(controlStyles, "h-10", className)} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlStyles, "min-h-24 resize-y py-2.5 leading-relaxed", className)} />;
}

/** Native select (keeps the platform picker and keyboard) with the dashboard outline and its own chevron. */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(controlStyles, "h-10 appearance-none pr-9", className)}>{children}</select>
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-app-text-3" />
    </div>
  );
}
