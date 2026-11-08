import Link from "next/link";
import { common } from "@/components/dashboard/shared/common-copy";
import { account, apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { CopyButton } from "@/components/copy-button";
import { focusRing } from "@/components/button-styles";
import { BASE_URL, mockModels } from "@/lib/model-catalog";
import { cn } from "@/lib/utils";
import { quickStartCopy as copy } from "./quick-start-copy";

const statLink = `rounded-sm text-xs font-medium text-accent-ink hover:underline ${focusRing}`;

/** Greeting with setup progress on the left; the base URL and account facts people copy from on the right. */
export function WelcomeBanner({ done, total }: { done: number; total: number }) {
  const firstName = account.userName.split(" ")[0];
  return (
    <section className="relative overflow-hidden rounded-card border border-border bg-linear-to-br from-accent-soft via-background to-background">
      <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full border border-accent-mark/20" />
      <div aria-hidden className="absolute -top-12 -right-12 size-48 rounded-full border border-accent-mark/20" />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-3">
          <p className="inline-flex rounded-full border border-accent-mark/30 bg-background/70 px-3 py-1 text-xs font-medium text-accent-ink">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {copy.greeting(firstName)}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{copy.sub}</p>
          <div className="mt-6 max-w-sm">
            <p className="text-sm font-medium">{copy.progress(done, total)}</p>
            <div aria-hidden className="mt-2 flex gap-1.5">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < done ? "bg-accent-mark" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>
        <dl className="divide-y divide-border rounded-panel border border-border bg-background/80 backdrop-blur-sm lg:col-span-2">
          <div className="px-4 py-3">
            <dt className="text-xs text-muted-foreground">{copy.baseUrl}</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <code className="truncate font-mono text-code">{BASE_URL}</code>
              <CopyButton text={BASE_URL} label={common.copy} copiedLabel={common.copied} iconOnly className="shrink-0" />
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-muted-foreground">{copy.activeKeys}</dt>
            <dd className="flex items-center gap-3">
              <span className="font-mono">{apiKeys.length}</span>
              <Link href="/api-keys" className={statLink}>{copy.manage}</Link>
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm text-muted-foreground">{copy.models}</dt>
            <dd className="flex items-center gap-3">
              <span className="font-mono">{mockModels.length}</span>
              <Link href="/models" className={statLink}>{copy.browse}</Link>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
