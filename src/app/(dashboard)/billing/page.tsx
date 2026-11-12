import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingSkeleton } from "@/components/dashboard/billing/billing-skeleton";
import { BillingView } from "@/components/dashboard/billing/billing-view";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { currentDepositRules } from "@/lib/server/payments/deposit-rules";
import { currentIdrPerUsd } from "@/lib/server/payments/exchange-rate";
import { userBalance, userDepositById, userDeposits } from "@/lib/server/payments/user-billing";

export const metadata: Metadata = { title: "Billing" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Reads the session itself (layouts do not re-run on navigation); every query is scoped to this user. */
async function Billing({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const [balance, idrPerUsd, rules, history, returned] = await Promise.all([
    userBalance(user.id),
    currentIdrPerUsd(),
    currentDepositRules(),
    userDeposits(user.id, parsePageParam(params.page)),
    userDepositById(user.id, params.deposit),
  ]);
  return <BillingView balance={balance} idrPerUsd={idrPerUsd} rules={rules} history={history} returned={returned} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <Billing searchParams={searchParams} />
    </Suspense>
  );
}
