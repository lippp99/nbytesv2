import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { type DayFigures, type MonthFigures, type UserFigures, grossMargin } from "@/lib/admin-overview-contract";
import { formatIdr, formatMicros, formatSignedMicros } from "@/lib/price-format";
import { overviewCopy } from "./overview-copy";

const pct = (bp: number) => `${(bp / 100).toFixed(1)}%`;
const n = (v: number) => v.toLocaleString("en-US");

/** §3.1, K1: usage charged, Surplus cost, gross margin and deposits, each on its own; then 24 hours and users. */
export function OverviewFigures({ month, day, users }: { month: MonthFigures; day: DayFigures; users: UserFigures }) {
  const m = overviewCopy.month;
  const d = overviewCopy.day;
  const margin = grossMargin(month.knownCostChargeMicros, month.knownCostMicros);
  const monthStats: SummaryStat[] = [
    { label: m.charge, value: formatMicros(month.chargeMicros), note: m.chargeNote },
    { label: m.cost, value: formatMicros(month.knownCostMicros), note: m.costNote(month.costPending) },
    { label: m.margin, value: formatSignedMicros(margin.micros), note: m.marginNote(margin.bp === null ? null : pct(margin.bp)),
      tone: margin.micros < 0 ? "danger" : undefined },
    { label: m.deposit, value: formatIdr(month.depositIdr), note: m.depositNote(month.depositCount, formatMicros(month.depositCreditMicros)) },
  ];
  const failedBp = day.requests ? Math.round((day.failed * 10_000) / day.requests) : 0;
  const dayStats: SummaryStat[] = [
    { label: d.requests, value: n(day.requests), note: d.requestsNote },
    { label: d.failed, value: `${pct(failedBp)} (${n(day.failed)})`, note: d.failedNote(day.failedOurs),
      tone: day.failedOurs ? "danger" : undefined },
    { label: d.latency, value: day.p50LatencyMs === null ? "—" : `${n(day.p50LatencyMs)} ms`, note: d.latencyNote },
    { label: d.users, value: n(users.total), note: d.usersNote(users.active30, users.newThisMonth, users.suspended) },
  ];
  return (
    <div className="space-y-4">
      <StatSummary stats={monthStats} label={m.label} />
      <StatSummary stats={dayStats} label={d.label} />
    </div>
  );
}
