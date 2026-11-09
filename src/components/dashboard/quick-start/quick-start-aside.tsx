import Link from "next/link";
import { Analytics01Icon, ArrowRight01Icon, BookOpen01Icon, CommandLineIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus, ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { ProviderLogo } from "@/components/provider-logo";
import { modelById, providerById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { ConnectionCard } from "./connection-card";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.aside;
const popularIds = ["claude-sonnet-4.5", "gpt-5", "gemini-2.5-pro", "deepseek-v3.2", "kimi-k2"];
const linkIcons = [CommandLineIcon, BookOpen01Icon, Analytics01Icon];
const row = `group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-app-hover ${appFocus}`;

function PopularModels() {
  return (
    <Card title={copy.popular} description={copy.perInput}
      action={<Link href="/models" className={ghostAction("-mr-2", "sm")}>{copy.allModels}</Link>}>
      <ul className="py-2">
        {popularIds.map((id) => {
          const m = modelById(id);
          if (!m) return null;
          return (
            <li key={id} className="flex items-center gap-3 px-6 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-app-inner border border-app-border bg-app-inset">
                <ProviderLogo icon={m.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-app-ui text-app-text">{m.name}</span>
                <span className="block truncate text-app-small text-app-text-3">{providerById(m.providerId)?.name}</span>
              </span>
              <span className="font-mono text-app-code text-app-text tabular-nums">{formatMicros(m.inputPerMTokMicros)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Right column: connection facts, popular models with prices, and the next places to go. */
export function QuickStartAside() {
  return (
    <div className="space-y-6">
      <ConnectionCard />
      <PopularModels />
      <Card title={copy.explore}>
        <ul className="py-2">
          {quickStartCopy.links.map((link, i) => (
            <li key={link.href}>
              <Link href={link.href} className={row}>
                <HugeiconsIcon icon={linkIcons[i]} aria-hidden className="size-4.5 shrink-0 text-app-text-3 group-hover:text-app-accent-text" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-app-ui font-medium text-app-text">{link.title}</span>
                  <span className="block text-app-small text-app-text-2">{link.body}</span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden
                  className="size-4 shrink-0 text-app-text-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
