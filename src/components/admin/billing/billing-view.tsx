import { PageHeader } from "@/components/app-kit/page-header";
import type { DepositRules } from "@/lib/payments/deposit-contract";
import type { Currency, DepositFilter, DepositsPage, ExchangeRateEntry } from "@/lib/payments/finance-contract";
import type { ProfitSummary as Summary } from "@/lib/payments/profit-contract";
import { billingCopy as copy } from "./billing-copy";
import { DepositRulesForm } from "./deposit-rules-form";
import { DepositsTable } from "./deposits-table";
import { ExchangeRateCard } from "./exchange-rate-card";
import { ProfitSummary } from "./profit-summary";

type BillingViewProps = {
  profit: Summary; deposits: DepositsPage; filter: DepositFilter; currency: Currency; rates: ExchangeRateEntry[];
  rules: DepositRules; currentMonth: string; today: string;
};

/** Profit of a period first (gateway margin and deposits together), then the rate, deposit rules and every deposit. */
export function BillingView({ profit, deposits, filter, currency, rates, rules, currentMonth, today }: BillingViewProps) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        <ProfitSummary data={profit} filter={filter} currency={currency} currentMonth={currentMonth} today={today} />
        <ExchangeRateCard history={rates} />
        <DepositRulesForm rules={rules} />
        <DepositsTable data={deposits} filter={filter} period={profit.period} currency={currency} currentMonth={currentMonth} />
      </div>
    </>
  );
}
