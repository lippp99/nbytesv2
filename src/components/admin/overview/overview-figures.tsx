import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import type { DayFigures, UserFigures } from "@/lib/admin-overview-contract";
import { overviewCopy } from "./overview-copy";

const pct = (bp: number) => `${(bp / 100).toFixed(1)}%`;
const n = (v: number) => v.toLocaleString("en-US");

/** §3.1: the last 24 hours and the accounts. Money of the month lives on the Billing page. */
export function OverviewFigures({ day, users }: { day: DayFigures; users: UserFigures }) {
  const d = overviewCopy.day;
  const failedBp = day.requests ? Math.round((day.failed * 10_000) / day.requests) : 0;
  const dayStats: SummaryStat[] = [
    { label: d.requests, value: n(day.requests), note: d.requestsNote },
    { label: d.failed, value: `${pct(failedBp)} (${n(day.failed)})`, note: d.failedNote(day.failedOurs),
      tone: day.failedOurs ? "danger" : undefined },
    { label: d.latency, value: day.p50LatencyMs === null ? "—" : `${n(day.p50LatencyMs)} ms`, note: d.latencyNote },
    { label: d.users, value: n(users.total), note: d.usersNote(users.active30, users.newThisMonth, users.suspended) },
  ];
  return <StatSummary stats={dayStats} label={d.label} />;
}
