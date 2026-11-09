"use client";

import { useState } from "react";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { TextInput } from "@/components/app-kit/field";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { ProviderLogo } from "@/components/provider-logo";
import type { Model } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { formatBp, marginBpOf, markupBpOf, parsePercentToBp } from "./margin-math";
import { modelsCopy } from "./models-copy";
import type { UpstreamCost } from "./models-data";

const copy = modelsCopy.table;

export type PricedModel = { model: Model; cost: UpstreamCost; sellIn: number; sellOut: number; custom: boolean; off: boolean };

type PricingTableProps = { rows: PricedModel[]; onMarkup: (id: string, bp: number) => void; onToggle: (id: string) => void };

/** Markup typed per row; applied on Enter or leaving the field, so half-typed values never reprice the model. */
function MarkupInput({ row, onMarkup }: { row: PricedModel; onMarkup: PricingTableProps["onMarkup"] }) {
  const current = formatBp(markupBpOf(row.cost.outMicros, row.sellOut)).replace("%", "");
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? current;
  const invalid = draft !== null && parsePercentToBp(draft) === null;

  function commit() {
    const bp = draft === null ? null : parsePercentToBp(draft);
    if (bp !== null) onMarkup(row.model.id, bp);
    if (!invalid) setDraft(null);
  }

  return (
    <span className="flex items-center gap-1.5">
      <TextInput inputMode="decimal" value={value} aria-label={copy.markupLabel(row.model.name)} aria-invalid={invalid || undefined}
        title={invalid ? modelsCopy.rules.invalid : undefined} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()} className="h-8 w-20 text-right font-mono text-app-code" />
      <span className="text-app-small text-app-text-3">%</span>
    </span>
  );
}

function Pair({ a, b }: { a: string; b: string }) {
  return <>{a} <span className="text-app-text-3">·</span> {b}</>;
}

export function PricingTable({ rows, onMarkup, onToggle }: PricingTableProps) {
  const cols = copy.cols;
  const active = rows.filter((r) => !r.off).length;
  return (
    <Card title={copy.title} description={`${copy.count(active, rows.length)} · ${copy.inOut}`}>
      <Table minWidth="min-w-5xl">
        <THead>
          <Th>{cols.model}</Th>
          <Th align="right">{cols.cost}</Th>
          <Th align="right">{cols.sell}</Th>
          <Th>{cols.markup}</Th>
          <Th align="right">{cols.margin}</Th>
          <Th>{cols.status}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.model.id} className={r.off ? "text-app-text-3" : undefined}>
              <Td>
                <span className="flex items-center gap-2.5">
                  <ProviderLogo icon={r.model.icon} className="size-4 shrink-0" />
                  <span className="font-mono text-app-code">{r.model.id}</span>
                  {r.custom && <Badge tone="accent">{copy.custom}</Badge>}
                </span>
              </Td>
              <Td align="right"><Pair a={formatMicros(r.cost.inMicros)} b={formatMicros(r.cost.outMicros)} /></Td>
              <Td align="right"><Pair a={formatMicros(r.sellIn)} b={formatMicros(r.sellOut)} /></Td>
              <Td><MarkupInput key={r.sellOut} row={r} onMarkup={onMarkup} /></Td>
              <Td align="right">{formatBp(marginBpOf(r.cost.outMicros, r.sellOut))}</Td>
              <Td>
                <span className="flex items-center gap-2">
                  <Badge tone={r.off ? "neutral" : "success"}>{r.off ? copy.off : copy.on}</Badge>
                  <button type="button" onClick={() => onToggle(r.model.id)} aria-label={`${r.off ? copy.enable : copy.disable} ${r.model.name}`}
                    className={secondaryAction(undefined, "sm")}>
                    {r.off ? copy.enable : copy.disable}
                  </button>
                </span>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
