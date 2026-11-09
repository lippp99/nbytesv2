import { type ModelUsage, usageByModel, usageTotals } from "@/components/dashboard/shared/dashboard-data";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { ProviderLogo } from "@/components/provider-logo";
import { modelById } from "@/lib/model-catalog";
import { formatCompact } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { CostChart } from "./cost-chart";
import { usage as copy } from "./usage-copy";
import { dailyCosts } from "./usage-data";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";

const errorRate = ((usageTotals.errors / usageTotals.requests) * 100).toFixed(3).replace(".", ",");
const stats: SummaryStat[] = [
  { label: copy.stats.cost, value: formatMicros(usageTotals.costMicros) },
  { label: copy.stats.requests, value: usageTotals.requests.toLocaleString("en-US"),
    note: `${usageTotals.errors} ${copy.errors} · ${errorRate}%`, tone: "danger" },
  { label: copy.stats.tokens, value: formatCompact(usageTotals.tokens) },
  { label: copy.stats.latency, value: `${usageTotals.latencyP50Ms} ms` },
];

function UsageRow({ row }: { row: ModelUsage }) {
  const model = modelById(row.modelId);
  const share = (row.costMicros / usageTotals.costMicros) * 100;
  return (
    <Tr>
      <Td>
        <span className="flex items-center gap-2.5">
          {model && <ProviderLogo icon={model.icon} className="size-4 shrink-0" />}
          <span className="font-mono text-app-code">{row.modelId}</span>
        </span>
      </Td>
      <Td align="right">{row.requests.toLocaleString("en-US")}</Td>
      <Td align="right">{formatCompact(row.tokens)}</Td>
      <Td align="right">{formatMicros(row.costMicros)}</Td>
      <Td>
        <span className="flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-hover">
            <span className="block h-full rounded-full bg-app-accent" style={{ width: `${share}%` }} />
          </span>
          <span className="w-10 text-right font-mono text-app-small text-app-text-2 tabular-nums">{Math.round(share)}%</span>
        </span>
      </Td>
    </Tr>
  );
}

export function UsageView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-6">
        <StatSummary stats={stats} label={copy.summary} />
        <Card title={copy.chartTitle} description={copy.chartSub}>
          <CostChart days={dailyCosts} />
        </Card>
        <Card title={copy.byModel} description={copy.byModelSub}>
          <Table>
            <THead>
              <Th>{cols.model}</Th>
              <Th align="right">{cols.requests}</Th>
              <Th align="right">{cols.tokens}</Th>
              <Th align="right">{cols.cost}</Th>
              <Th className="w-56">{cols.share}</Th>
            </THead>
            <tbody>{usageByModel.map((row) => <UsageRow key={row.modelId} row={row} />)}</tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
