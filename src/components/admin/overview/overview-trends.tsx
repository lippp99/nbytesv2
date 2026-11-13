import { type BarSeries, BarChart } from "@/components/app-kit/bar-chart";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { LineChartIcon } from "@/components/icons/content/line-chart";
import type { TrendDay } from "@/lib/admin-overview-contract";
import { formatCents } from "@/lib/price-format";
import { overviewCopy } from "./overview-copy";

const t = overviewCopy.trend;
const n = (v: number) => v.toLocaleString("en-US");
// Validated pair (dataviz validator, both themes): app-accent and app-chart-2.
const usageSeries: BarSeries[] = [{ name: t.charge, className: "bg-app-accent" }, { name: t.cost, className: "bg-app-chart-2" }];
const requestSeries: BarSeries[] = [{ name: t.ok, className: "bg-app-chart-2" }, { name: t.failed, className: "bg-app-accent" }];

/** §3.3, K3/K5: two daily charts over 30 WIB days; one axis each, never two scales on one chart. */
export function OverviewTrends({ days }: { days: TrendDay[] }) {
  const empty = days.every((d) => d.requests === 0);
  const none = <EmptyState icon={LineChartIcon} title={t.empty} body={t.emptyBody} className="py-8" />;
  return (
    <section aria-label={t.title} className="grid gap-6 xl:grid-cols-2">
      <Card title={t.usageTitle}>
        {empty ? none : (
          <BarChart mode="grouped" series={usageSeries} format={formatCents} tableCaption={t.usageCaption} dateHeader={t.date}
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
