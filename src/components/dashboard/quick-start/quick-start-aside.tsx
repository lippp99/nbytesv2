import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus, ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { StatisticsIcon } from "@/components/dashboard/shared/icons/statistics";
import { TerminalIcon } from "@/components/dashboard/shared/icons/terminal";
import { BookIcon } from "@/components/icons/content/book";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { formatMicros } from "@/lib/price-format";
import { ConnectionCard } from "./connection-card";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.aside;
// Owner's two-tone icons, in the order of quickStartCopy.links: terminal, buku (as the header's Docs link), statistik.
const linkIcons = [TerminalIcon, BookIcon, StatisticsIcon];
const row = `group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-app-hover ${appFocus}`;

/** Q2: the cheapest active models by input price; name with the id under it, no provider logo (D1). */
function CheapestModels({ models }: { models: CatalogModel[] }) {
  if (models.length === 0) return null;
  return (
    <Card title={copy.cheapest} description={copy.perInput}
      action={<Link href="/models" className={ghostAction("-mr-2", "sm")}>{copy.allModels}</Link>}>
      <ul className="py-2">
        {models.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-6 py-2">
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-app-ui text-app-text">{m.name}</span>
              <span className="block truncate font-mono text-app-small text-app-text-3">{m.id}</span>
            </span>
            <span className="font-mono text-app-code text-app-text tabular-nums">{formatMicros(m.inputMicros)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type QuickStartAsideProps = { baseUrl: string; keyCount: number; modelCount: number; cheapest: CatalogModel[] };

/** Right column: connection facts, the cheapest models with prices, and the next places to go. */
export function QuickStartAside({ baseUrl, keyCount, modelCount, cheapest }: QuickStartAsideProps) {
  return (
    <div className="space-y-6">
      <ConnectionCard baseUrl={baseUrl} keyCount={keyCount} modelCount={modelCount} />
      <CheapestModels models={cheapest} />
      <Card title={copy.explore}>
        <ul className="py-2">
          {quickStartCopy.links.map((link, i) => {
            const Icon = linkIcons[i];
            return (
              <li key={link.href}>
                <Link href={link.href} className={row}>
                  <Icon className="size-4.5 shrink-0 text-app-text-3 group-hover:text-app-accent-text" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-app-ui font-medium text-app-text">{link.title}</span>
                    <span className="block text-app-small text-app-text-2">{link.body}</span>
                  </span>
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden
                    className="size-4 shrink-0 text-app-text-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
