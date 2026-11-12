import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { playground as copy } from "./playground-copy";

const block = "block animate-pulse rounded-app-inner bg-app-hover motion-reduce:animate-none";

/** Shown while the catalog streams in: the real header, the work area and the parameter panel as placeholders. */
export function PlaygroundSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading} className="grid gap-6 lg:grid-cols-3">
        <div className="min-h-140 rounded-app-card border border-app-border bg-app-surface p-6 lg:col-span-2 lg:h-176">
          <span aria-hidden className={`${block} h-full`} />
        </div>
        <Card title={copy.settings.title}>
          <div className="space-y-4 p-6">
            {[0, 1, 2].map((i) => <span key={i} aria-hidden className={`${block} h-10`} />)}
          </div>
        </Card>
      </div>
    </>
  );
}
