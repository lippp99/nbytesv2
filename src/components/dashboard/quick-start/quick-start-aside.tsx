import Link from "next/link";
import { Analytics01Icon, ArrowRight01Icon, ArrowUpRight01Icon, BookOpen01Icon, CommandLineIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { ProviderLogo } from "@/components/provider-logo";
import { modelById, providerById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.aside;
const popularIds = ["claude-sonnet-4.5", "gpt-5", "gemini-2.5-pro", "deepseek-v3.2", "kimi-k2"];
const linkIcons = [CommandLineIcon, BookOpen01Icon, Analytics01Icon];
const card = "rounded-card border border-border bg-card";
const rowLink = `group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted ${focusRing}`;

function PopularModels() {
  return (
    <section className={card}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-medium">{copy.popular}</h2>
        <span className="text-xs text-muted-foreground">{copy.perInput}</span>
      </div>
      <ul className="pb-2">
        {popularIds.map((id) => {
          const m = modelById(id);
          if (!m) return null;
          return (
            <li key={id} className="flex items-center gap-3 px-4 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-chip bg-muted">
                <ProviderLogo icon={m.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm">{m.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{providerById(m.providerId)?.name}</span>
              </span>
              <span className="font-mono text-code">{formatMicros(m.inputPerMTokMicros)}</span>
            </li>
          );
        })}
      </ul>
      <Link href="/models" className={`${rowLink} rounded-b-card border-t border-border text-sm font-medium text-accent-ink`}>
        {copy.allModels}
        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}

/** Right column: popular models with prices, the next places to go, and one tip worth doing before launch. */
export function QuickStartAside() {
  return (
    <div className="space-y-4">
      <PopularModels />
      <section className={card}>
        <h2 className="px-4 pt-4 pb-2 text-sm font-medium">{copy.explore}</h2>
        <ul className="pb-2">
          {quickStartCopy.links.map((link, i) => (
            <li key={link.href}>
              <Link href={link.href} className={rowLink}>
                <span className="grid size-8 shrink-0 place-items-center rounded-chip bg-accent-soft text-accent-ink">
                  <HugeiconsIcon icon={linkIcons[i]} aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-medium">{link.title}</span>
                  <span className="block text-xs text-muted-foreground">{link.body}</span>
                </span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden
                  className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="dark rounded-card bg-ink-panel p-5 text-foreground">
        <h2 className="font-medium">{copy.tipTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.tipBody}</p>
        <Link href="/api-keys" className={`group mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent-ink ${focusRing}`}>
          {copy.tipAction}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}
