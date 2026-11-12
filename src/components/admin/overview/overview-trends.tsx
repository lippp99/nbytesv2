import { type BarSeries, BarChart } from "@/components/app-kit/bar-chart";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { LineChartIcon } from "@/components/icons/content/line-chart";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { type TopModel, type TopUser, type TrendDay, grossMargin } from "@/lib/admin-overview-contract";
import { formatMicros, formatSignedMicros } from "@/lib/price-format";
import { overviewCopy } from "./overview-copy";

const t = overviewCopy.trend;
const n = (v: number) => v.toLocaleString("en-US");
// Validated pair (dataviz validator, both themes): app-accent and app-chart-2.
const usageSeries: BarSeries[] = [{ name: t.charge, className: "bg-app-accent" }, { name: t.cost, className: "bg-app-chart-2" }];
const requestSeries: BarSeries[] = [{ name: t.ok, className: "bg-app-chart-2" }, { name: t.failed, className: "bg-app-accent" }];

/** §3.3, K3/K5: two daily charts over 30 UTC days; one axis each, never two scales on one chart. */
export function OverviewTrends({ days }: { days: TrendDay[] }) {
  const empty = days.every((d) => d.requests === 0);
  const none = <EmptyState icon={LineChartIcon} title={t.empty} body={t.emptyBody} className="py-8" />;
  return (
    <section aria-label={t.title} className="grid gap-6 xl:grid-cols-2">
      <Card title={t.usageTitle}>
        {empty ? none : (
          <BarChart mode="grouped" series={usageSeries} format={formatMicros} tableCaption={t.usageCaption} dateHeader={t.date}
            days={days.map((d) => ({ date: d.date, values: [d.chargeMicros, d.costMicros] }))} />
        )}
      </Card>
      <Card title={t.requestsTitle}>
        {empty ? none : (
          <BarChart mode="stacked" series={requestSeries} format={n} tableCaption={t.requestsCaption} dateHeader={t.date}
            days={days.map((d) => ({ date: d.date, values: [d.requests - d.failed, d.failed] }))} />
        )}
      </Card>
    </section>
  );
}

/** §3.4: five models and five users of this month by amount charged. */
export function OverviewTop({ models, users }: { models: TopModel[]; users: TopUser[] }) {
  const c = overviewCopy.top;
  const none = <EmptyState icon={LineChartIcon} title={c.empty} body={c.emptyBody} className="py-8" />;
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card title={c.modelsTitle} className="xl:col-span-3">
        {models.length === 0 ? none : (
          <Table minWidth="min-w-2xl">
            <THead>
              <Th>{c.cols.model}</Th><Th align="right">{c.cols.requests}</Th><Th align="right">{c.cols.input}</Th>
              <Th align="right">{c.cols.output}</Th><Th align="right">{c.cols.charge}</Th><Th align="right">{c.cols.cost}</Th>
              <Th align="right">{c.cols.margin}</Th>
            </THead>
            <tbody>
              {models.map((m) => (
                <Tr key={m.modelId}>
                  <Td className="font-mono text-app-code">{m.modelId}</Td>
                  <Td align="right">{n(m.requests)}</Td><Td align="right">{n(m.inputTokens)}</Td><Td align="right">{n(m.outputTokens)}</Td>
                  <Td align="right">{formatMicros(m.chargeMicros)}</Td><Td align="right">{formatMicros(m.costMicros)}</Td>
                  <Td align="right">{formatSignedMicros(grossMargin(m.knownCostChargeMicros, m.costMicros).micros)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card title={c.usersTitle} className="xl:col-span-2">
        {users.length === 0 ? none : (
          <Table minWidth="min-w-md">
            <THead>
              <Th>{c.cols.user}</Th><Th align="right">{c.cols.requests}</Th><Th align="right">{c.cols.charge}</Th>
              <Th align="right">{c.cols.balance}</Th>
            </THead>
            <tbody>
              {users.map((u, i) => (
                <Tr key={u.email ?? `deleted-${i}`}>
                  <Td className="max-w-48 truncate">{u.email ?? <span className="text-app-text-3">{c.deleted}</span>}</Td>
                  <Td align="right">{n(u.requests)}</Td><Td align="right">{formatMicros(u.chargeMicros)}</Td>
                  <Td align="right">{formatSignedMicros(u.balanceMicros)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
