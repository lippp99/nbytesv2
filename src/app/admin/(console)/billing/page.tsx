import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingSkeleton } from "@/components/admin/billing/billing-skeleton";
import { BillingView } from "@/components/admin/billing/billing-view";
import { dayOf, monthOf, parsePeriod } from "@/lib/admin-gateway/usage-contract";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { parseCurrency, parseDepositFilter } from "@/lib/payments/finance-contract";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { currentDepositRules } from "@/lib/server/payments/deposit-rules";
import { exchangeRateHistory, listDeposits, profitSummary } from "@/lib/server/payments/finance-report";

export const metadata: Metadata = { title: "Billing · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Billing({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const now = new Date();
  const filter = parseDepositFilter(params.status);
  const currency = parseCurrency(params.currency);
  const [profit, deposits, rates, rules] = await Promise.all([
    profitSummary(parsePeriod(params, now), now),
    listDeposits(filter, parsePageParam(params.page)),
    exchangeRateHistory(),
    currentDepositRules(),
  ]);
  return (
    <BillingView profit={profit} deposits={deposits} filter={filter} currency={currency} rates={rates} rules={rules}
      currentMonth={monthOf(now)} today={dayOf(now)} />
  );
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <Billing searchParams={searchParams} />
    </Suspense>
  );
}
