import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { grossMargin } from "@/lib/admin-overview-contract";
import { type UsagePeriod, type UsageTotals, changeBp } from "@/lib/admin-gateway/usage-contract";
import { formatCents, formatSignedCents } from "@/lib/price-format";
import { usageCopy } from "./usage-copy";
import { count, percent, periodName, signedPercent } from "@/components/admin/shared/report-format";

const s = usageCopy.summary;
const totalTokens = (t: UsageTotals) => t.inputTokens + t.outputTokens;

/** Note under a figure: its change against the previous period, or that the previous period had nothing. */
function vsPrevious(current: number, previous: number, before: string): string {
  const bp = changeBp(current, previous);
  return bp === null ? s.noPrevious(before) : s.change(signedPercent(bp), before);
}

type UsageSummaryProps = { previous: UsagePeriod; totals: UsageTotals; previousTotals: UsageTotals };

/** The period's headline figures: tokens first, then money and accounts, each compared with the period before. */
export function UsageSummary({ previous, totals: t, previousTotals: p }: UsageSummaryProps) {
  const before = periodName(previous);
  const margin = grossMargin(t.knownCostChargeMicros, t.costMicros);
  const tokens: SummaryStat[] = [
    { label: s.total, value: count(totalTokens(t)), note: vsPrevious(totalTokens(t), totalTokens(p), before) },
    { label: s.input, value: count(t.inputTokens), note: vsPrevious(t.inputTokens, p.inputTokens, before) },
    { label: s.output, value: count(t.outputTokens), note: vsPrevious(t.outputTokens, p.outputTokens, before) },
    { label: s.requests, value: count(t.requests), note: s.requestsNote(count(t.failed)) },
  ];
  const money: SummaryStat[] = [
    { label: s.charge, value: formatCents(t.chargeMicros), note: vsPrevious(t.chargeMicros, p.chargeMicros, before) },
    { label: s.cost, value: formatCents(t.costMicros), note: s.costNote(t.costPending) },
    { label: s.margin, value: formatSignedCents(margin.micros), note: s.marginNote(margin.bp === null ? null : percent(margin.bp)),
      tone: margin.micros < 0 ? "danger" : undefined },
    { label: s.accounts, value: count(t.users), note: s.accountsNote(t.models) },
  ];
  return (
    <div className="space-y-4">
      <StatSummary stats={tokens} label={s.tokensLabel} />
      <StatSummary stats={money} label={s.moneyLabel} />
    </div>
  );
}
