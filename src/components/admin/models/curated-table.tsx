"use client";

import { useState } from "react";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import type { CuratedModel } from "@/lib/gateway/catalog-contract";
import { formatMicros } from "@/lib/price-format";
import { DeactivateDialog } from "./deactivate-dialog";
import { formatBp, parsePercentToBp } from "./markup-format";
import { modelsCopy } from "./models-copy";
import { SaveNoticeLine } from "./save-notice";
import { useSaveModel } from "./use-save-model";

const copy = modelsCopy.curated;

/** How a curated row compares with the live Surplus catalog (unknown when the catalog could not be read). */
export type CatalogState = { kind: "same" | "unknown" | "gone" } | { kind: "changed"; nowIn: number; nowOut: number };
export type CuratedRow = CuratedModel & { catalog: CatalogState };

type SaveFn = ReturnType<typeof useSaveModel>["save"];

/** Applied on Enter or leaving the field, so a half-typed value never reprices the model. */
function MarkupInput({ row, busy, save }: { row: CuratedRow; busy: boolean; save: SaveFn }) {
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parsePercentToBp(draft) === null;

  async function commit() {
    const bp = draft === null ? null : parsePercentToBp(draft);
    if (bp === null) return;
    if (bp === row.markupBp) return setDraft(null);
    if (await save({ modelId: row.modelId, markupBp: bp, active: true }, modelsCopy.saved.markup)) setDraft(null);
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
        {busy && <span className="text-app-small text-app-text-2">{modelsCopy.saving}</span>}
      </span>
      {invalid && <span id={errorId} className="max-w-48 text-app-small text-app-danger">{copy.invalid}</span>}
    </span>
  );
}

/** Sell price (what users pay) with the Surplus list price it comes from under it. */
function Price({ sell, list }: { sell: number; list: number }) {
  return (
    <span className="flex flex-col items-end py-2">
      <span className="text-app-text">{formatMicros(sell)}</span>
      <span className="text-app-small text-app-text-3">{copy.listPrice(formatMicros(list))}</span>
    </span>
  );
}

/** Short flag under the model id; the long explanation of "gone" is said once above the table. */
function CatalogFlag({ state }: { state: CatalogState }) {
  if (state.kind === "gone") return <Badge tone="danger" className="mt-1.5">{copy.gone}</Badge>;
  if (state.kind !== "changed") return null;
  return (
    <span className="mt-1.5 flex flex-col items-start gap-1">
      <Badge tone="warning">{copy.listChanged}</Badge>
      <span className="text-app-small text-app-text-2">{copy.listChangedHint(`${formatMicros(state.nowIn)} · ${formatMicros(state.nowOut)}`)}</span>
    </span>
  );
}

function StatusAction({ row, busy, save }: { row: CuratedRow; busy: boolean; save: SaveFn }) {
  if (row.active) {
    return <DeactivateDialog modelId={row.modelId} busy={busy}
      onConfirm={() => save({ modelId: row.modelId, markupBp: row.markupBp, active: false }, modelsCopy.saved.disabled)} />;
  }
  return (
    <button type="button" disabled={busy} aria-busy={busy || undefined} aria-label={`${copy.enable} ${row.modelId}`}
      className={secondaryAction(undefined, "sm")}
      onClick={() => save({ modelId: row.modelId, markupBp: row.markupBp, active: true }, modelsCopy.saved.enabled)}>
      {busy ? modelsCopy.saving : copy.enable}
    </button>
  );
}

export function CuratedTable({ rows }: { rows: CuratedRow[] }) {
  const { pending, notice, save } = useSaveModel();
  const cols = copy.cols;
  const gone = rows.filter((r) => r.active && r.catalog.kind === "gone").length;
  return (
    <>
      {gone > 0 && (
        <p className="flex items-start gap-2 border-b border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">
          <Badge tone="danger" className="shrink-0">{copy.gone}</Badge>
          <span>{copy.goneHint(gone)}</span>
        </p>
      )}
      <Table minWidth="min-w-3xl">
        <THead>
          <Th>{cols.model}</Th>
          <Th>{cols.markup}</Th>
          <Th align="right">{cols.input}</Th>
          <Th align="right">{cols.output}</Th>
          <Th>{cols.status}</Th>
          <Th>{cols.action}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.modelId} className={r.active ? undefined : "text-app-text-3"}>
              <Td className="py-2">
                <span className="block font-mono text-app-code">{r.modelId}</span>
                <CatalogFlag state={r.catalog} />
              </Td>
              <Td><MarkupInput key={r.markupBp} row={r} busy={pending === r.modelId} save={save} /></Td>
              <Td align="right"><Price sell={r.inputMicros} list={r.listInputMicros} /></Td>
              <Td align="right"><Price sell={r.outputMicros} list={r.listOutputMicros} /></Td>
              <Td><Badge tone={r.active ? "success" : "neutral"}>{r.active ? copy.on : copy.off}</Badge></Td>
              <Td><StatusAction row={r} busy={pending === r.modelId} save={save} /></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <SaveNoticeLine notice={notice} />
    </>
  );
}
