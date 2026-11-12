import { PageHeader } from "@/components/app-kit/page-header";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import type { DepositRules } from "@/lib/payments/deposit-contract";
import type { DepositFilter, DepositSummary, DepositsPage, ExchangeRateEntry } from "@/lib/payments/finance-contract";
import { formatIdr, formatMicros } from "@/lib/price-format";
import { billingCopy as copy } from "./billing-copy";
import { DepositRulesForm } from "./deposit-rules-form";
import { DepositsTable } from "./deposits-table";
import { ExchangeRateCard } from "./exchange-rate-card";

type BillingViewProps = {
  summary: DepositSummary; deposits: DepositsPage; filter: DepositFilter; rates: ExchangeRateEntry[]; rules: DepositRules;
};

function summaryStats(s: DepositSummary): SummaryStat[] {
  const st = copy.stats;
  return [
    { label: st.received, value: formatIdr(s.receivedIdr), note: st.paidCount(s.paidCount) },
    { label: st.providerFee, value: formatIdr(s.providerFeeIdr), note: st.net(formatIdr(s.netIdr)) },
    { label: st.credited, value: formatMicros(s.creditMicros), note: st.creditedNote },
    { label: st.stuck, value: String(s.stuckCount), note: st.stuckNote(s.stuckCount), tone: s.stuckCount ? "danger" : undefined },
  ];
}

/** Real deposit data only; revenue, upstream cost and margin come back once the gateway records requests. */
export function BillingView({ summary, deposits, filter, rates, rules }: BillingViewProps) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        <StatSummary stats={summaryStats(summary)} label={copy.summary} />
        <ExchangeRateCard history={rates} />
        <DepositRulesForm rules={rules} />
        <DepositsTable data={deposits} filter={filter} />
      </div>
    </>
  );
}
