import { ProviderLogo } from "@/components/provider-logo";
import { modelById } from "@/lib/model-catalog";
import { formatCompact } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { CostChart } from "./cost-chart";
import { usage as copy } from "./usage-copy";
import { type ModelUsage, usageByModel, usageTotals } from "@/components/dashboard/shared/dashboard-data";
import { dailyCosts } from "./usage-data";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Panel } from "@/components/dashboard/shared/panel";
import { StatTile } from "./stat-tile";

const errorRate = ((usageTotals.errors / usageTotals.requests) * 100).toFixed(3).replace(".", ",");

function UsageRow({ row }: { row: ModelUsage }) {
  const model = modelById(row.modelId);
  const share = (row.costMicros / usageTotals.costMicros) * 100;
  return (
    <tr className="border-t border-border">
      <td className="py-3 pl-4 sm:pl-5">
        <span className="flex items-center gap-2.5">
          {model && <ProviderLogo icon={model.icon} className="size-4" />}
          {row.modelId}
        </span>
      </td>
      <td className="py-3 text-right">{row.requests.toLocaleString("en-US")}</td>
      <td className="py-3 text-right">{formatCompact(row.tokens)}</td>
      <td className="py-3 text-right">{formatMicros(row.costMicros)}</td>
      <td className="py-3 pr-4 pl-6 sm:pr-5">
        <span className="flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-accent-mark" style={{ width: `${share}%` }} />
          </span>
          <span className="w-10 text-right text-muted-foreground">{Math.round(share)}%</span>
        </span>
      </td>
    </tr>
  );
}

export function UsageView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={copy.stats.cost} value={formatMicros(usageTotals.costMicros)} />
        <StatTile
          label={copy.stats.requests}
          value={usageTotals.requests.toLocaleString("en-US")}
          note={`${usageTotals.errors} ${copy.errors} · ${errorRate}%`}
          tone="danger"
        />
        <StatTile label={copy.stats.tokens} value={formatCompact(usageTotals.tokens)} />
        <StatTile label={copy.stats.latency} value={`${usageTotals.latencyP50Ms} ms`} />
      </div>
      <Panel title={copy.chartTitle} className="mt-3">
        <CostChart days={dailyCosts} />
      </Panel>
      <Panel title={copy.byModel} className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th scope="col" className="py-3 pl-4 font-normal sm:pl-5">{cols.model}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.requests}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.tokens}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.cost}</th>
                <th scope="col" className="w-40 py-3 pr-4 pl-6 font-normal sm:pr-5">{cols.share}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-code tabular-nums">
              {usageByModel.map((row) => <UsageRow key={row.modelId} row={row} />)}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
