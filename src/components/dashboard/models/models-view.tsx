"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp01Icon, ArrowUpDownIcon, CubeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { Badge } from "@/components/app-kit/badge";
import { appFocus, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { SearchInput } from "@/components/app-kit/field";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { modelsCopy as copy } from "./models-copy";
import { type SortKey, filterModels, formatTokens, sortModels } from "./models-filter";

function ModelRow({ model: m }: { model: CatalogModel }) {
  return (
    <Tr>
      <Td>
        <span className="block font-medium text-app-text">{m.name}</span>
        <span className="flex items-center font-mono text-app-small text-app-text-3">
          {m.id}
          <CopyButton text={m.id} label={common.copy} copiedLabel={common.copied} failedLabel={common.copyFailed} iconOnly />
        </span>
      </Td>
      <Td align="right">{formatTokens(m.contextLength, formatContext)}</Td>
      <Td align="right">{formatTokens(m.maxCompletionTokens, formatContext)}</Td>
      <Td align="right">{formatMicros(m.inputMicros)}</Td>
      <Td align="right">{formatMicros(m.outputMicros)}</Td>
      <Td>{m.supportsImages && <Badge>{copy.images}</Badge>}</Td>
    </Tr>
  );
}

type SortHeaderProps = { label: string; column: Exclude<SortKey, "name">; sort: SortKey; onSort: (key: SortKey) => void };

/** Price column header: first click sorts cheapest first, a second click returns to name order. */
function SortHeader({ label, column, sort, onSort }: SortHeaderProps) {
  const on = sort === column;
  return (
    <Th align="right" sort={on ? "ascending" : "none"}>
      <button type="button" onClick={() => onSort(on ? "name" : column)} title={on ? copy.sortReset(label) : copy.sortBy(label)}
        className={cn("inline-flex items-center gap-1 rounded-app-inner hover:text-app-text", on && "text-app-text", appFocus)}>
        {label}
        <HugeiconsIcon icon={on ? ArrowUp01Icon : ArrowUpDownIcon} aria-hidden className="size-3.5" />
      </button>
    </Th>
  );
}

/** The active models from the curated catalog (server); search and price sort run in the browser. */
export function ModelsView({ models }: { models: CatalogModel[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const rows = sortModels(filterModels(models, query), sort);
  const cols = copy.cols;

  if (models.length === 0) {
    return (
      <>
        <PageHeader title={copy.title} sub={copy.sub} />
        <Card>
          <EmptyState icon={CubeIcon} title={copy.noModels.title} body={copy.noModels.body}
            action={<Link href="/contact" className={secondaryAction()}>{copy.noModels.contact}</Link>} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-app-border bg-app-inset px-6 py-4">
          <SearchInput aria-label={copy.search} value={query} placeholder={copy.searchPlaceholder} wrapperClassName="w-full sm:w-72"
            clearLabel={copy.clearSearch} onClear={() => setQuery("")} onChange={(e) => setQuery(e.target.value)} />
          <p aria-live="polite" className="text-app-small text-app-text-3 sm:ml-auto">{copy.count(rows.length, models.length)}</p>
        </div>
        {rows.length > 0 ? (
          <Table minWidth="min-w-3xl">
            <THead>
              <Th>{cols.model}</Th>
              <Th align="right">{cols.context}</Th>
              <Th align="right">{cols.maxOutput}</Th>
              <SortHeader label={cols.input} column="input" sort={sort} onSort={setSort} />
              <SortHeader label={cols.output} column="output" sort={sort} onSort={setSort} />
              <Th>{cols.features}</Th>
            </THead>
            <tbody>{rows.map((m) => <ModelRow key={m.id} model={m} />)}</tbody>
          </Table>
        ) : (
          <EmptyState icon={CubeIcon} title={copy.empty.title} body={copy.empty.body}
            action={<button type="button" onClick={() => setQuery("")} className={secondaryAction()}>{copy.empty.reset}</button>} />
        )}
      </Card>
    </>
  );
}
