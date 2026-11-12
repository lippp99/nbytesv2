import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { apiKeysCopy as copy } from "./api-keys-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the key list streams in: the real header, then placeholder rows (skeleton, not a spinner). */
export function ApiKeysSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card title={copy.list}>
        <div role="status" aria-label={copy.loading} className="divide-y divide-app-border">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 px-6 py-4">
              <span aria-hidden className={`${bar} h-3 w-1/4`} />
              <span aria-hidden className={`${bar} h-3 w-24`} />
              <span aria-hidden className={`${bar} h-3 w-32`} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
