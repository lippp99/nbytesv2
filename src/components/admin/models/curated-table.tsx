"use client";

import { useState } from "react";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { Table, Td, Th, Tr } from "@/components/app-kit/table";
import type { CuratedModel } from "@/lib/gateway/catalog-contract";
import { formatMicros } from "@/lib/price-format";
import { formatBp, parsePercentToBp } from "./markup-format";
import { modelsCopy } from "./models-copy";
import { SaveNoticeLine } from "./save-notice";
import { useSaveModel } from "./use-save-model";

const copy = modelsCopy.curated;

/** How a curated row compares with the live Surplus catalog (unknown when the catalog could not be read). */
export type CatalogState = { kind: "same" | "unknown" | "gone" } | { kind: "changed"; nowIn: number; nowOut: number };
export type CuratedRow = CuratedModel & { catalog: CatalogState };

/** Group header: a hairline under it ties "Harga list" / "Harga jual" to its own Input and Output columns. */
const groupHead = "h-9 border-b border-app-border pb-0 text-center";

type SaveFn = ReturnType<typeof useSaveModel>["save"];

/** Applied on Enter or leaving the field, so a half-typed value never reprices the model. */
function MarkupInput({ row, busy, save }: { row: CuratedRow; busy: boolean; save: SaveFn }) {
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parsePercentToBp(draft) === null;

  async function commit() {
    const bp = draft === null ? null : parsePercentToBp(draft);
    if (bp === null) return;
    if (bp === row.markupBp) return setDraft(null);
    if (await save({ modelId: row.modelId, markupBp: bp, active: true })) setDraft(null);
  }

  const errorId = `markup-${row.modelId}-error`;
  return (
    <span className="flex flex-col gap-1 py-2">
      <span className="flex items-center gap-1.5">
        <TextInput inputMode="decimal" value={draft ?? formatBp(row.markupBp)} disabled={busy || !row.active}
          aria-label={copy.markupLabel(row.modelId)} aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-8 w-20 text-right font-mono text-app-code tabular-nums" />
        <span className="text-app-small text-app-text-3">%</span>
      </span>
      {invalid && <span id={errorId} className="max-w-48 text-app-small text-app-danger">{copy.invalid}</span>}
    </span>
  );
}

/** Badge plus the sentence that explains it, written out (a hover title would hide it from touch and keyboard). */
function CatalogFlag({ state }: { state: CatalogState }) {
  if (state.kind === "gone") return <Flag tone="danger" label={copy.gone} hint={copy.goneHint} />;
  if (state.kind !== "changed") return null;
  const now = `${formatMicros(state.nowIn)} · ${formatMicros(state.nowOut)}`;
  return <Flag tone="warning" label={copy.listChanged} hint={copy.listChangedHint(now)} />;
}

function Flag({ tone, label, hint }: { tone: "danger" | "warning"; label: string; hint: string }) {
  return (
    <span className="mt-1.5 flex max-w-md flex-col items-start gap-1">
      <Badge tone={tone}>{label}</Badge>
      <span className="text-app-small text-app-text-2">{hint}</span>
    </span>
  );
}

export function CuratedTable({ rows }: { rows: CuratedRow[] }) {
  const { pending, notice, save } = useSaveModel(modelsCopy.saved);
  const cols = copy.cols;
  return (
    <>
      <Table minWidth="min-w-4xl">
        {/* Two header rows: each price group names its own Input and Output columns. */}
        <thead className="border-b border-app-border">
          <tr>
            <Th className="align-bottom" rowSpan={2}>{cols.model}</Th>
            <Th colSpan={2} className={groupHead}>{cols.list}</Th>
            <Th className="align-bottom" rowSpan={2}>{cols.markup}</Th>
            <Th colSpan={2} className={groupHead}>{cols.sell}</Th>
            <Th className="align-bottom" rowSpan={2}>{cols.status}</Th>
          </tr>
          <tr>
            <Th align="right" className="h-8 first:pl-4">{cols.input}</Th>
            <Th align="right" className="h-8">{cols.output}</Th>
            <Th align="right" className="h-8">{cols.input}</Th>
            <Th align="right" className="h-8 last:pr-4">{cols.output}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.modelId} className={r.active ? undefined : "text-app-text-3"}>
              <Td className="py-2">
                <span className="font-mono text-app-code">{r.modelId}</span>
                <CatalogFlag state={r.catalog} />
              </Td>
              <Td align="right">{formatMicros(r.listInputMicros)}</Td>
              <Td align="right">{formatMicros(r.listOutputMicros)}</Td>
              <Td><MarkupInput key={r.markupBp} row={r} busy={pending === r.modelId} save={save} /></Td>
              <Td align="right">{formatMicros(r.inputMicros)}</Td>
              <Td align="right">{formatMicros(r.outputMicros)}</Td>
              <Td>
                <span className="flex items-center gap-2">
                  <Badge tone={r.active ? "success" : "neutral"}>{r.active ? copy.on : copy.off}</Badge>
                  <button type="button" disabled={pending === r.modelId} aria-busy={pending === r.modelId || undefined}
                    aria-label={`${r.active ? copy.disable : copy.enable} ${r.modelId}`} className={secondaryAction(undefined, "sm")}
                    onClick={() => save({ modelId: r.modelId, markupBp: r.markupBp, active: !r.active })}>
                    {r.active ? copy.disable : copy.enable}
                  </button>
                </span>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <SaveNoticeLine notice={notice} />
    </>
  );
}
