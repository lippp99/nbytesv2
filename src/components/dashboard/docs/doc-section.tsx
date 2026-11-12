import type { ReactNode } from "react";

type Endpoint = { method: "GET" | "POST"; path: string };
/** `wide`: content that needs the full width (a table), placed under the two columns. */
type DocSectionProps = { id: string; title: string; endpoint?: Endpoint; children: ReactNode; examples: ReactNode; wide?: ReactNode };

// Both methods neutral: accent is for actions and selection, not labels (D1); the word tells them apart.
const methodTag = "rounded-app-inner border border-app-border bg-app-inset px-2 py-0.5 font-mono text-app-small font-medium text-app-text-2";

/** One reference topic: explanation and fields on the left, examples on the right that stay in view while reading. */
export function DocSection({ id, title, endpoint, children, examples, wide }: DocSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-app-border pt-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-app-section text-app-text">{title}</h2>
          {endpoint && (
            <p className="mt-3 flex items-center gap-2">
              <span className={methodTag}>{endpoint.method}</span>
              <code className="font-mono text-app-code text-app-text">{endpoint.path}</code>
            </p>
          )}
          <div className="mt-4 space-y-4 text-app-body text-app-text-2">{children}</div>
        </div>
        <div className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">{examples}</div>
      </div>
      {wide && <div className="mt-8">{wide}</div>}
    </section>
  );
}
