import { PageHeader } from "@/components/app-kit/page-header";
import { playground as copy } from "./playground-copy";

const block = "block animate-pulse rounded-app-inner bg-app-hover motion-reduce:animate-none";

/** Shown while the catalog streams in: the real header, then the work area with its parameter row as placeholders. */
export function PlaygroundSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading}
        className="flex min-h-140 flex-col overflow-hidden rounded-app-card border border-app-border bg-app-surface lg:h-190">
        <div className="flex flex-wrap gap-2 border-b border-app-border bg-app-inset px-4 py-3">
          {["w-56", "w-40", "w-44", "w-36"].map((w) => <span key={w} aria-hidden className={`${block} h-10 ${w} max-sm:w-full`} />)}
        </div>
        <div className="flex-1 p-6"><span aria-hidden className={`${block} h-full`} /></div>
      </div>
    </>
  );
}
