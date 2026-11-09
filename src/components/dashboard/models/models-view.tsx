"use client";

import { useState } from "react";
import { CubeIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { Select, TextInput } from "@/components/app-kit/field";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { ProviderLogo } from "@/components/provider-logo";
import { type Model, capabilityLabels, mockModels, mockProviders, providerById } from "@/lib/model-catalog";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { modelsCopy as copy } from "./models-copy";

const providers = mockProviders.filter((p) => mockModels.some((m) => m.providerId === p.id));

function matches(model: Model, query: string, providerId: string): boolean {
  const q = query.trim().toLowerCase();
  const textHit = !q || [model.id, model.name].some((s) => s.toLowerCase().includes(q));
  return textHit && (!providerId || model.providerId === providerId);
}

function ModelRow({ model: m }: { model: Model }) {
  return (
    <Tr>
      <Td>
        <span className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-app-inner border border-app-border bg-app-inset">
            <ProviderLogo icon={m.icon} className="size-4.5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-medium text-app-text">{m.name}</span>
            <span className="flex items-center font-mono text-app-small text-app-text-3">
              {m.id}
              <CopyButton text={m.id} label={common.copy} copiedLabel={common.copied} iconOnly />
            </span>
          </span>
        </span>
      </Td>
      <Td className="text-app-text-2">{providerById(m.providerId)?.name}</Td>
      <Td align="right">{formatContext(m.contextTokens)}</Td>
      <Td align="right">{formatMicros(m.inputPerMTokMicros)}</Td>
      <Td align="right">{formatMicros(m.outputPerMTokMicros)}</Td>
      <Td>
        <span className="flex flex-wrap gap-1.5">{m.capabilities.map((c) => <Badge key={c}>{capabilityLabels[c]}</Badge>)}</span>
      </Td>
    </Tr>
  );
}

export function ModelsView() {
  const [query, setQuery] = useState("");
  const [providerId, setProviderId] = useState("");
  const rows = mockModels.filter((m) => matches(m, query, providerId));
  const reset = () => { setQuery(""); setProviderId(""); };
  const cols = copy.cols;

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-app-border px-6 py-4">
          <div className="relative w-full sm:w-72">
            <HugeiconsIcon icon={Search01Icon} aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-text-3" />
            <TextInput type="search" aria-label={copy.search} value={query} placeholder={copy.searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="w-full sm:w-52">
            <Select aria-label={copy.provider} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="">{copy.allProviders}</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <p aria-live="polite" className="text-app-small text-app-text-3 sm:ml-auto">{copy.count(rows.length, mockModels.length)}</p>
        </div>
        {rows.length > 0 ? (
          <Table minWidth="min-w-4xl">
            <THead>
              <Th>{cols.model}</Th>
              <Th>{cols.provider}</Th>
              <Th align="right">{cols.context}</Th>
              <Th align="right">{cols.input}</Th>
              <Th align="right">{cols.output}</Th>
              <Th>{cols.features}</Th>
            </THead>
            <tbody>{rows.map((m) => <ModelRow key={m.id} model={m} />)}</tbody>
          </Table>
        ) : (
          <EmptyState icon={CubeIcon} title={copy.empty.title} body={copy.empty.body}
            action={<button type="button" onClick={reset} className={secondaryAction()}>{copy.empty.reset}</button>} />
        )}
      </Card>
    </>
  );
}
