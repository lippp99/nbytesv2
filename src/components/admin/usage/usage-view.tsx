import Link from "next/link";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { type BarSeries, BarChart } from "@/components/app-kit/bar-chart";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Pagination } from "@/components/app-kit/pagination";
import { LineChartIcon } from "@/components/icons/content/line-chart";
import { type UsageFilters, type UsageReport, usageHref } from "@/lib/admin-gateway/usage-contract";
import { usageCopy as copy } from "./usage-copy";
import { count, monthName, periodName, shortMonthName } from "@/components/admin/shared/report-format";
import { UsageSummary } from "./usage-summary";
import { ModelUsageTable, UserUsageTable } from "./usage-tables";
import { UsageToolbar } from "./usage-toolbar";
import { UsageUserSearch } from "./usage-user-search";

// Validated pair (dataviz validator, both themes), the same as the overview charts.
const tokenSeries: BarSeries[] = [
  { name: copy.chart.input, className: "bg-app-chart-2" }, { name: copy.chart.output, className: "bg-app-accent" },
];

type UsageViewProps = { data: UsageReport; query: UsageFilters; currentMonth: string; today: string };
type CardProps = Omit<UsageViewProps, "today"> & { allTokens: number };

/** Each table pages on its own; moving one keeps the other where it is. */
function ModelsCard({ data, query, currentMonth, allTokens }: CardProps) {
  const m = copy.models;
  return (
    <Card title={m.title(data.models.total)} description={m.description}>
      <ModelUsageTable rows={data.models.rows} allTokens={allTokens} />
      <Pagination page={data.models.page} pages={data.models.pages} labels={m.pagination}
        href={(modelPage) => usageHref(query, currentMonth, { modelPage, page: data.users.page })} />
    </Card>
  );
}

function UsersCard({ data, query, currentMonth, allTokens }: CardProps) {
  const u = copy.users;
  const reset = usageHref({ ...query, search: null }, currentMonth);
  return (
    <Card title={u.title(data.users.total)} description={u.description}
      action={<UsageUserSearch key={query.search ?? ""} query={query} currentMonth={currentMonth} />}>
      {data.users.rows.length === 0 ? (
        <EmptyState icon={Search01Icon} title={u.noMatch.title} body={u.noMatch.body}
          action={<Link href={reset} className={secondaryAction()}>{u.noMatch.reset}</Link>} />
      ) : (
        <UserUsageTable rows={data.users.rows} allTokens={allTokens} />
      )}
      <Pagination page={data.users.page} pages={data.users.pages} labels={u.pagination}
        href={(page) => usageHref(query, currentMonth, { page, modelPage: data.models.page })} />
    </Card>
  );
}

/** One period of usage: headline figures, tokens per day (or month), then every model and every account. */
export function UsageView({ data, query, currentMonth, today }: UsageViewProps) {
  const months = data.months.map((value) => ({ value, label: monthName(value) }));
  const allTokens = data.totals.inputTokens + data.totals.outputTokens;
  const byMonth = data.bucket === "month";
  const name = periodName(data.period);
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      {/* keyed on the period kind, so going back in history resets a kind picked but not yet applied */}
      <UsageToolbar key={data.period.kind} query={query} currentMonth={currentMonth} today={today} months={months} years={data.years} />
      {data.totals.requests === 0 ? (
        <Card><EmptyState icon={LineChartIcon} title={copy.empty.title(name)} body={copy.empty.body} /></Card>
      ) : (
        <div className="space-y-10">
          <UsageSummary previous={data.previous} totals={data.totals} previousTotals={data.previousTotals} />
          <Card title={copy.chart.title(byMonth)} description={name}>
            <BarChart mode="stacked" series={tokenSeries} format={count} dateHeader={copy.chart.date}
              tableCaption={copy.chart.caption(byMonth, name)} dateLabel={byMonth ? shortMonthName : undefined}
              days={data.buckets.map((d) => ({ date: d.date, values: [d.inputTokens, d.outputTokens] }))} />
          </Card>
          <ModelsCard data={data} query={query} currentMonth={currentMonth} allTokens={allTokens} />
          <UsersCard data={data} query={query} currentMonth={currentMonth} allTokens={allTokens} />
          <p className="text-app-small text-app-text-3">{copy.costNote}</p>
        </div>
      )}
    </>
  );
}
