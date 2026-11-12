import { Card } from "@/components/app-kit/card";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatCompact } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import type { KeyUsage, ModelUsage } from "@/lib/usage-contract";
import { usage as copy } from "./usage-copy";

const cols = copy.cols;
const count = (n: number) => n.toLocaleString("en-US");

/** Share of the period's cost; a neutral bar, since it repeats the Cost column next to it (D3). */
function Share({ chargeMicros, totalMicros }: { chargeMicros: number; totalMicros: number }) {
  const share = totalMicros > 0 ? (chargeMicros / totalMicros) * 100 : 0;
  return (
    <span className="flex items-center gap-3">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-hover">
        <span className="block h-full rounded-full bg-app-text-3" style={{ width: `${share}%` }} />
      </span>
      <span className="w-10 text-right font-mono text-app-small text-app-text-2 tabular-nums">{Math.round(share)}%</span>
    </span>
  );
}

/** Name from the catalog with the id under it; a model no longer in the catalog shows its id only (D2). */
function ModelName({ row }: { row: ModelUsage }) {
  if (!row.name) return <span className="font-mono text-app-code">{row.modelId}</span>;
  return (
    <span className="block leading-tight">
      <span className="block font-medium">{row.name}</span>
      <span className="font-mono text-app-small text-app-text-3">{row.modelId}</span>
    </span>
  );
}

export function ModelTable({ rows, totalMicros }: { rows: ModelUsage[]; totalMicros: number }) {
  return (
    <Card title={copy.byModel} description={copy.byModelSub}>
      <Table>
        <THead>
          <Th>{cols.model}</Th>
          <Th align="right">{cols.requests}</Th>
          <Th align="right">{cols.tokens}</Th>
          <Th align="right">{cols.cost}</Th>
          <Th className="w-56">{cols.share}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.modelId}>
              <Td><ModelName row={r} /></Td>
              <Td align="right">{count(r.requests)}</Td>
              <Td align="right">{formatCompact(r.tokens)}</Td>
              <Td align="right">{formatMicros(r.chargeMicros)}</Td>
              <Td><Share chargeMicros={r.chargeMicros} totalMicros={totalMicros} /></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

/** A key by name and prefix; requests without a key come from the Playground. */
function KeyName({ row }: { row: KeyUsage }) {
  if (!row.keyId) return <span className="font-medium">{copy.playground}</span>;
  return (
    <span className="block leading-tight">
      <span className="block font-medium">
        {row.name}
        {row.revoked && <span className="ml-2 text-app-small font-normal text-app-text-3">({copy.revoked})</span>}
      </span>
      <span className="font-mono text-app-small text-app-text-3">{row.keyPrefix}…</span>
    </span>
  );
}

export function KeyTable({ rows, totalMicros }: { rows: KeyUsage[]; totalMicros: number }) {
  return (
    <Card title={copy.byKey} description={copy.byKeySub}>
      <Table>
        <THead>
          <Th>{cols.key}</Th>
          <Th align="right">{cols.requests}</Th>
          <Th align="right">{cols.cost}</Th>
          <Th className="w-56">{cols.share}</Th>
        </THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.keyId ?? "playground"}>
              <Td><KeyName row={r} /></Td>
              <Td align="right">{count(r.requests)}</Td>
              <Td align="right">{formatMicros(r.chargeMicros)}</Td>
              <Td><Share chargeMicros={r.chargeMicros} totalMicros={totalMicros} /></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
