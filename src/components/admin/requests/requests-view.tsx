"use client";

import { useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/app-kit/badge";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Segmented } from "@/components/app-kit/segmented";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import { formatMicros } from "@/lib/price-format";
import { type Filter, requestsCopy as copy } from "./requests-copy";
import { type RequestRow, requestRows } from "./requests-data";

const isOk = (row: RequestRow) => row.status < 400;

function StatusBadge({ status }: { status: number }) {
  if (status < 400) return <Badge tone="success">{status}</Badge>;
  return <Badge tone={status >= 500 ? "danger" : "warning"}>{status}</Badge>;
}

export function RequestsView() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = requestRows.filter((r) => filter === "all" || (filter === "ok") === isOk(r));
  const cols = copy.cols;
  const options = (Object.keys(copy.filters) as Filter[]).map((value) => ({ value, label: copy.filters[value] }));

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub}
        action={<Segmented label={copy.filter} options={options} value={filter} onChange={setFilter} />} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Search01Icon} title={copy.empty} body={copy.emptyBody} />
        ) : (
          <Table minWidth="min-w-4xl">
            <THead>
              <Th>{cols.at}</Th>
              <Th>{cols.user}</Th>
              <Th>{cols.model}</Th>
              <Th>{cols.status}</Th>
              <Th align="right">{cols.latency}</Th>
              <Th align="right">{cols.tokens}</Th>
              <Th align="right">{cols.cost}</Th>
            </THead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatUtc(r.at)}</Td>
                  <Td className="max-w-56 truncate">{r.user}</Td>
                  <Td className="font-mono text-app-code">{r.modelId}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td align="right">{`${r.latencyMs.toLocaleString("en-US")} ms`}</Td>
                  <Td align="right">{r.tokens.toLocaleString("en-US")}</Td>
                  <Td align="right">{formatMicros(r.costMicros)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
