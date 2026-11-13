import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingSkeleton } from "@/components/admin/billing/billing-skeleton";
import { BillingView } from "@/components/admin/billing/billing-view";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { parseDepositFilter } from "@/lib/payments/finance-contract";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { currentDepositRules } from "@/lib/server/payments/deposit-rules";
import { depositSummary, exchangeRateHistory, listDeposits } from "@/lib/server/payments/finance-report";

export const metadata: Metadata = { title: "Billing · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Billing({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const filter = parseDepositFilter(params.status);
  const [summary, deposits, rates, rules] = await Promise.all([
    depositSummary(),
    listDeposits(filter, parsePageParam(params.page)),
    exchangeRateHistory(),
    currentDepositRules(),
  ]);
  return <BillingView summary={summary} deposits={deposits} filter={filter} rates={rates} rules={rules} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <Billing searchParams={searchParams} />
    </Suspense>
  );
}
