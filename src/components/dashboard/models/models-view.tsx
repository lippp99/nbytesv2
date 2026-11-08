"use client";

import { useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/copy-button";
import { ProviderLogo } from "@/components/provider-logo";
import { capabilityLabels, type Model, mockModels, providerById } from "@/lib/model-catalog";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { modelsCopy as copy } from "./models-copy";
import { common } from "@/components/dashboard/shared/common-copy";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Panel } from "@/components/dashboard/shared/panel";

const searchBox =
  "mt-8 flex h-11 max-w-md items-center gap-2 rounded-full border border-input px-4 " +
  "focus-within:border-foreground focus-within:ring-2 focus-within:ring-accent-mark";

function matches(query: string, haystack: string[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || haystack.some((s) => s.toLowerCase().includes(q));
}

function ModelRow({ model: m }: { model: Model }) {
  return (
    <tr className="border-t border-border">
      <td className="py-3 pl-4 sm:pl-5">
        <span className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-chip bg-muted">
            <ProviderLogo icon={m.icon} className="size-4.5" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{m.name}</span>
            <span className="flex items-center font-mono text-label text-muted-foreground">
              {m.id}
              <CopyButton text={m.id} label={common.copy} copiedLabel={common.copied} iconOnly />
            </span>
          </span>
        </span>
      </td>
      <td className="py-3 text-right font-mono text-code">{formatContext(m.contextTokens)}</td>
      <td className="py-3 text-right font-mono text-code">{formatMicros(m.inputPerMTokMicros)}</td>
      <td className="py-3 text-right font-mono text-code">{formatMicros(m.outputPerMTokMicros)}</td>
      <td className="py-3 pr-4 pl-8 sm:pr-5">
        <span className="flex flex-wrap gap-1">
          {m.capabilities.map((c) => (
            <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{capabilityLabels[c]}</span>
          ))}
        </span>
      </td>
    </tr>
  );
}

export function ModelsView() {
  const [query, setQuery] = useState("");
  const rows = mockModels.filter((m) => matches(query, [m.id, m.name, providerById(m.providerId)?.name ?? ""]));
  const cols = copy.cols;

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <label className={searchBox}>
        <HugeiconsIcon icon={Search01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">{copy.search}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.search}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      <Panel className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th scope="col" className="py-3 pl-4 font-normal sm:pl-5">{cols.model}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.context}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.input}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.output}</th>
                <th scope="col" className="py-3 pr-4 pl-8 font-normal sm:pr-5">{cols.features}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => <ModelRow key={m.id} model={m} />)}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">{copy.empty}</p>}
        </div>
      </Panel>
    </>
  );
}
