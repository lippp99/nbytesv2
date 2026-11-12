import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Endpoint = { method: "GET" | "POST"; path: string };
/** `wide`: content that needs the full width (a table), placed under both columns. */
type DocSectionProps = { id: string; title: string; endpoint?: Endpoint; children: ReactNode; examples: ReactNode; wide?: ReactNode };

// Both methods neutral: accent is for actions and selection, not labels (D1); the word tells them apart.
export const methodTag =
  "rounded-app-inner border border-app-border bg-app-inset px-2 py-0.5 font-mono text-app-small font-medium text-app-text";

/**
 * One reference topic, one row of the reference frame: explanation and fields on the left, examples in an inset column
 * on the right that stays in view while reading. Below lg the examples follow the text. scroll-mt clears the sticky
 * header (64px) and the section bar.
 */
export function DocSection({ id, title, endpoint, children, examples, wide }: DocSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`}
      className={cn("grid scroll-mt-32 border-b border-app-border last:border-b-0", examples && "lg:grid-cols-[minmax(0,1fr)_30rem]")}>
      <div className="min-w-0 px-5 py-8 sm:p-10">
        <h2 id={`${id}-title`} className="text-app-section text-app-text">{title}</h2>
        {endpoint && (
          <p className="mt-3 flex items-center gap-2.5">
            <span className={methodTag}>{endpoint.method}</span>
            <code className="font-mono text-app-code text-app-text">{endpoint.path}</code>
          </p>
        )}
        <div className="mt-5 max-w-prose space-y-4 text-app-body text-app-text-2">{children}</div>
      </div>
      {examples && (
        <div className="min-w-0 border-t border-app-border bg-app-inset px-5 py-8 sm:p-8 lg:border-t-0 lg:border-l">
          <div className="space-y-5 lg:sticky lg:top-36">{examples}</div>
        </div>
      )}
      {wide && <div className="min-w-0 border-t border-app-border px-5 py-8 sm:p-10 lg:col-span-2">{wide}</div>}
    </section>
  );
}
