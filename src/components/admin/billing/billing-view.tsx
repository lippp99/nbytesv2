import { Badge } from "@/components/app-kit/badge";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import { formatMicros } from "@/lib/price-format";
import { billingCopy as copy, paymentBadge } from "./billing-copy";
import { financeTotals as t, payments } from "./billing-data";

const marginMicros = t.revenueMonthMicros - t.upstreamCostMonthMicros;
// Integer basis points first, so the percentage never comes from float money math.
const marginBp = Math.round((marginMicros * 10_000) / t.revenueMonthMicros);

const stats: SummaryStat[] = [
  { label: copy.stats.revenue, value: formatMicros(t.revenueMonthMicros), note: copy.refunds(formatMicros(t.refundsMonthMicros)) },
  { label: copy.stats.upstream, value: formatMicros(t.upstreamCostMonthMicros) },
  { label: copy.stats.margin, value: formatMicros(marginMicros), note: `${(marginBp / 100).toFixed(1)}%` },
  { label: copy.stats.outstanding, value: formatMicros(t.outstandingMicros) },
];

export function BillingView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-6">
        <StatSummary stats={stats} label={copy.summary} />
        <Card title={copy.payments} description={copy.paymentsSub}>
          <Table minWidth="min-w-3xl">
            <THead>
              <Th>{cols.at}</Th>
              <Th>{cols.customer}</Th>
              <Th>{cols.kind}</Th>
              <Th>{cols.method}</Th>
              <Th align="right">{cols.amount}</Th>
              <Th>{cols.status}</Th>
            </THead>
            <tbody>
              {payments.map((p) => {
                const badge = paymentBadge[p.status];
                return (
                  <Tr key={p.id}>
                    <Td className="font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatUtc(p.at)}</Td>
                    <Td className="max-w-56 truncate">{p.customer}</Td>
                    <Td>{p.kind}</Td>
                    <Td className="text-app-text-2">{p.method}</Td>
                    <Td align="right">{formatMicros(p.amountMicros)}</Td>
                    <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
