import { monthName, periodName, shortMonthName } from "@/components/admin/shared/report-format";
import { type BarSeries, BarChart } from "@/components/app-kit/bar-chart";
import { Card } from "@/components/app-kit/card";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import type { Currency, DepositFilter } from "@/lib/payments/finance-contract";
import {
  type Flows, type ProfitSummary as Summary, type ProfitTotals, bucketProfits, profitTotals,
} from "@/lib/payments/profit-contract";
import { formatIdr, formatCents, formatSignedIdr, formatSignedCents } from "@/lib/price-format";
import { BillingToolbar } from "./billing-toolbar";
import { billingCopy } from "./billing-copy";

const c = billingCopy.profit;
const loss = (value: number) => (value < 0 ? ("danger" as const) : undefined);
// Validated pair (dataviz validator, both themes): profit in app-chart-2 above zero, a loss in app-accent below it.
const profitSeries: BarSeries[] = [{ name: c.chartSeries, className: "bg-app-chart-2", negativeClassName: "bg-app-accent" }];

/** Net profit per WIB day (per month for a year), in the chosen currency; nothing in rupiah before the first deposit. */
function ProfitChart({ d, currency }: { d: Summary; currency: Currency }) {
  const rows = bucketProfits(d);
  if (currency === "idr" && rows.some((r) => r.idr === null)) return null;
  const byMonth = d.bucket === "month";
  const format = currency === "usd" ? formatSignedCents : formatSignedIdr;
  return (
    <Card title={c.chartTitle(byMonth)} description={c.chartNote}>
      <BarChart mode="grouped" series={profitSeries} format={format} dateHeader={c.chartDate}
        tableCaption={c.chartCaption(byMonth, periodName(d.period))} dateLabel={byMonth ? shortMonthName : undefined}
        days={rows.map((r) => ({ date: r.date, values: [currency === "usd" ? r.usd : (r.idr ?? 0)] }))} />
    </Card>
  );
}

/** One flow per card, each in the chosen currency; rupiah needs a paid deposit for the rate ("—" before that). */
function flowStats(t: ProfitTotals, currency: Currency): [SummaryStat[], SummaryStat[]] {
  const f: Flows | null = currency === "usd" ? t.usd : t.idr;
  const money = (v: number) => (!f ? c.none : currency === "usd" ? formatSignedCents(v) : formatSignedIdr(v));
  const stat = (label: string, note: string, v: number, signed = false): SummaryStat =>
    ({ label, value: money(v), note: f ? note : c.noneNote, tone: f && signed ? loss(v) : undefined });
  const apiNote = currency === "idr" && t.idrPerUsd ? c.apiNoteIdr(formatIdr(t.idrPerUsd)) : c.apiNote;
  const z = f ?? { api: 0, fee: 0, surplus: 0, sumopod: 0, apiProfit: 0, feeProfit: 0, profit: 0 };
  return [[
    stat(c.api, apiNote, z.api), stat(c.depositFee, c.depositFeeNote, z.fee),
    stat(c.surplus, c.surplusNote, z.surplus), stat(c.sumopod, c.sumopodNote, z.sumopod),
  ], [
    stat(c.apiProfit, c.apiProfitNote, z.apiProfit, true), stat(c.feeProfit, c.feeProfitNote, z.feeProfit, true),
    stat(c.profit, c.profitNote, z.profit, true),
  ]];
}

type ProfitSummaryProps = { data: Summary; filter: DepositFilter; currency: Currency; currentMonth: string; today: string };

/** Money in and out, then the results, in the chosen currency. */
export function ProfitSummary({ data: d, filter, currency, currentMonth, today }: ProfitSummaryProps) {
  const t = profitTotals(d);
  const [flowsRow, resultsRow] = flowStats(t, currency);
  const deposited: SummaryStat = {
    label: c.depositIn, value: currency === "usd" ? formatCents(d.creditMicros) : formatIdr(d.amountIdr), note: c.depositInNote,
  };
  const months = d.months.map((value) => ({ value, label: monthName(value) }));
  return (
    <section aria-labelledby="profit-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="profit-title" className="text-app-section text-app-text">{c.title(periodName(d.period))}</h2>
        {/* keyed on the period kind, so going back in history resets a kind picked but not yet applied */}
        <BillingToolbar key={d.period.kind} filter={filter} currency={currency} period={d.period} currentMonth={currentMonth}
          today={today} months={months} years={d.years} />
      </div>
      <StatSummary stats={flowsRow} label={c.flowsLabel} />
      <StatSummary stats={[...resultsRow, deposited]} label={c.resultsLabel} />
      <ProfitChart d={d} currency={currency} />
    </section>
  );
}
