import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { type UsagePeriod, type UsageTotals, changeBp } from "@/lib/admin-gateway/usage-contract";
import { usageCopy } from "./usage-copy";
import { count, periodName, signedPercent } from "@/components/admin/shared/report-format";

const s = usageCopy.summary;
const totalTokens = (t: UsageTotals) => t.inputTokens + t.outputTokens;

/** Note under a figure: its change against the previous period, or that the previous period had nothing. */
function vsPrevious(current: number, previous: number, before: string): string {
  const bp = changeBp(current, previous);
  return bp === null ? s.noPrevious(before) : s.change(signedPercent(bp), before);
}

type UsageSummaryProps = { previous: UsagePeriod; totals: UsageTotals; previousTotals: UsageTotals };

/** The period's headline figures, each compared with the period before. Money lives on the Billing page. */
export function UsageSummary({ previous, totals: t, previousTotals: p }: UsageSummaryProps) {
  const before = periodName(previous);
  const stats: SummaryStat[] = [
    { label: s.total, value: count(totalTokens(t)), note: vsPrevious(totalTokens(t), totalTokens(p), before) },
    { label: s.input, value: count(t.inputTokens), note: vsPrevious(t.inputTokens, p.inputTokens, before) },
    { label: s.output, value: count(t.outputTokens), note: vsPrevious(t.outputTokens, p.outputTokens, before) },
    { label: s.requests, value: count(t.requests), note: s.requestsNote(count(t.failed), count(t.users), count(t.models)) },
  ];
  return <StatSummary stats={stats} label={s.tokensLabel} />;
}
