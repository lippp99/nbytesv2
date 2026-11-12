"use client";

import { useState } from "react";
import { Badge } from "@/components/app-kit/badge";
import { ghostAction, secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { type SurplusTextModel, hasZeroListPrice } from "@/lib/gateway/catalog-contract";
import { formatMicros } from "@/lib/price-format";
import { modelsCopy } from "./models-copy";
import { SaveNoticeLine } from "./save-notice";
import { useSaveModel } from "./use-save-model";

const copy = modelsCopy.surplus;
const PAGE = 50;
type Filter = keyof typeof copy.filters;
const filterOptions = (Object.keys(copy.filters) as Filter[]).map((value) => ({ value, label: copy.filters[value] }));

export type CatalogModel = Omit<SurplusTextModel, "maxCompletionTokens">;

const formatContext = (tokens: number | null) =>
  tokens === null ? "—" : tokens >= 1_000_000 ? `${tokens / 1_000_000}M`.replace(/(\.\d)\d+M/, "$1M") : `${Math.round(tokens / 1000)}K`;

function matches(m: CatalogModel, query: string) {
  const q = query.trim().toLowerCase();
  return !q || [m.modelId, m.name, m.provider ?? ""].some((v) => v.toLowerCase().includes(q));
}

function Action({ model, picked, busy, onAdd }: { model: CatalogModel; picked: boolean; busy: boolean; onAdd: () => void }) {
  if (picked) return <Badge tone="success">{copy.added}</Badge>;
  if (hasZeroListPrice(model)) return <Badge tone="warning">{copy.zero}</Badge>;
  return (
    <button type="button" disabled={busy} aria-busy={busy || undefined} aria-label={copy.addLabel(model.modelId)}
      onClick={onAdd} className={secondaryAction(undefined, "sm")}>
      {copy.add}
    </button>
  );
}

/** Live Surplus text models with search; adding one sells it at list price (markup 0%), changed later above. */
export function CatalogTable({ models, curatedIds }: { models: CatalogModel[]; curatedIds: string[] }) {
  const { pending, notice, save } = useSaveModel(modelsCopy.saved);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);
  const picked = new Set(curatedIds);
  const found = models.filter((m) => matches(m, query) && (filter === "all" || !picked.has(m.modelId)));
  const shown = found.slice(0, limit);
  const cols = copy.cols;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-app-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <TextInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={query} className="sm:max-w-xs"
          onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} />
        <Segmented label={copy.filterLabel} options={filterOptions} value={filter}
          onChange={(next) => { setFilter(next); setLimit(PAGE); }} />
      </div>
      <p className="px-6 pt-3 text-app-small text-app-text-2" aria-live="polite">{copy.count(found.length, models.length)}</p>
      {shown.length === 0 ? (
        <p className="px-6 py-8 text-app-ui text-app-text-2">{copy.none}</p>
      ) : (
        <Table minWidth="min-w-4xl">
          <THead>
            <Th>{cols.model}</Th>
            <Th>{cols.provider}</Th>
            <Th align="right">{cols.input}</Th>
            <Th align="right">{cols.output}</Th>
            <Th align="right">{cols.context}</Th>
            <Th>{cols.images}</Th>
            <Th>{cols.action}</Th>
          </THead>
          <tbody>
            {shown.map((m) => (
              <Tr key={m.modelId}>
                <Td>
                  <span className="block font-mono text-app-code">{m.modelId}</span>
                  {m.name !== m.modelId && <span className="block text-app-small text-app-text-2">{m.name}</span>}
                </Td>
                <Td className="text-app-text-2">{m.provider ?? "—"}</Td>
                <Td align="right">{formatMicros(m.listInputMicros)}</Td>
                <Td align="right">{formatMicros(m.listOutputMicros)}</Td>
                <Td align="right">{formatContext(m.contextLength)}</Td>
                <Td className="text-app-text-2">{m.supportsImages ? copy.yes : "—"}</Td>
                <Td>
                  <Action model={m} picked={picked.has(m.modelId)} busy={pending === m.modelId}
                    onAdd={() => save({ modelId: m.modelId, markupBp: 0, active: true })} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {found.length > limit && (
        <div className="border-t border-app-border px-6 py-3">
          <button type="button" className={ghostAction(undefined, "sm")} onClick={() => setLimit((n) => n + PAGE)}>
            {copy.more(Math.min(PAGE, found.length - limit))}
          </button>
        </div>
      )}
      <SaveNoticeLine notice={notice} />
      <p className="border-t border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">
        {copy.zeroHint} {copy.note}
      </p>
    </>
  );
}
