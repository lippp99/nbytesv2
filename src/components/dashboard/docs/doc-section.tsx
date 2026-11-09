import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Endpoint = { method: "GET" | "POST"; path: string };
type DocSectionProps = { id: string; title: string; endpoint?: Endpoint; children: ReactNode; examples: ReactNode };

const methodTone = {
  POST: "bg-app-accent-soft text-app-accent-text",
  GET: "border border-app-border bg-app-inset text-app-text-2",
};

/** One reference topic: explanation and fields on the left, examples on the right that stay in view while reading. */
export function DocSection({ id, title, endpoint, children, examples }: DocSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-app-border pt-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-app-section text-app-text">{title}</h2>
          {endpoint && (
            <p className="mt-3 flex items-center gap-2">
              <span className={cn("rounded-app-inner px-2 py-0.5 font-mono text-app-small font-medium", methodTone[endpoint.method])}>
                {endpoint.method}
              </span>
              <code className="font-mono text-app-code text-app-text">{endpoint.path}</code>
            </p>
          )}
          <div className="mt-4 space-y-4 text-app-body text-app-text-2">{children}</div>
        </div>
        <div className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">{examples}</div>
      </div>
    </section>
  );
}
