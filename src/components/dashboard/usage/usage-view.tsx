import Link from "next/link";
import { StatisticsIcon } from "@/components/dashboard/shared/icons/statistics";
import { BarChart, type BarSeries } from "@/components/app-kit/bar-chart";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { formatCompact } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { type UsageData, type UsageSummary, errorRateLabel, formatDuration } from "@/lib/usage-contract";
import { usage as copy } from "./usage-copy";
import { KeyTable, ModelTable } from "./usage-tables";

const series: BarSeries[] = [{ name: copy.chartSeries, className: "bg-app-accent" }];

function stats(s: UsageSummary): SummaryStat[] {
  return [
    { label: copy.stats.cost, value: formatMicros(s.chargeMicros) },
    { label: copy.stats.requests, value: s.requests.toLocaleString("en-US"),
      note: copy.requestsNote(s.errors, errorRateLabel(s.errors, s.requests), s.stopped), tone: s.errors > 0 ? "danger" : undefined },
    { label: copy.stats.tokens, value: formatCompact(s.tokens) },
    { label: copy.stats.duration, value: s.medianMs === null ? copy.noDuration : formatDuration(s.medianMs), note: copy.durationNote },
  ];
}

function NoUsage() {
  return (
    <Card>
      <EmptyState icon={StatisticsIcon} title={copy.empty.title} body={copy.empty.body} action={
        <span className="flex flex-wrap justify-center gap-2">
          <Link href="/api-keys" className={primaryAction()}>{copy.empty.keys}</Link>
          <Link href="/playground" className={secondaryAction()}>{copy.empty.playground}</Link>
        </span>
      } />
    </Card>
  );
}

/** The user's last 30 UTC days from gateway_requests, read on the server (page.tsx). */
export function UsageView({ data }: { data: UsageData }) {
  const { summary, days, models, keys } = data;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      {summary.requests === 0 ? <NoUsage /> : (
        <div className="space-y-6">
          <div className="space-y-2">
            <StatSummary stats={stats(summary)} label={copy.summary} />
            {summary.pending > 0 && <p className="text-app-small text-app-text-2">{copy.pending(summary.pending)}</p>}
          </div>
          <Card title={copy.chartTitle} description={copy.chartSub}>
            <BarChart mode="grouped" series={series} days={days.map((d) => ({ date: d.date, values: [d.chargeMicros] }))}
              format={formatMicros} tableCaption={copy.chartTable} dateHeader={copy.date} />
          </Card>
          <ModelTable rows={models} totalMicros={summary.chargeMicros} />
          <KeyTable rows={keys} totalMicros={summary.chargeMicros} />
        </div>
      )}
      <p className="mt-4 text-app-small text-app-text-3">{copy.timezone}</p>
    </>
  );
}
