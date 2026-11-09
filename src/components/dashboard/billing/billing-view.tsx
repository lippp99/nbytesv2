import Link from "next/link";
import { ArrowRight01Icon, CreditCardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { account, monthlyBudgetMicros, usageTotals } from "@/components/dashboard/shared/dashboard-data";
import { Badge } from "@/components/app-kit/badge";
import { ghostAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatMicros } from "@/lib/price-format";
import { billing as copy } from "./billing-copy";
import { invoices } from "./billing-data";

const statusTone = { paid: "success", open: "accent" } as const;

/** This period's bill and limit on the left; plan and payment method beside it, in one card. */
function CurrentBill() {
  const used = Math.min(100, Math.round((usageTotals.costMicros / monthlyBudgetMicros) * 100));
  return (
    <Card>
      <div className="grid lg:grid-cols-3">
        <div className="p-6 lg:col-span-2">
          <p className="text-app-ui text-app-text-2">{copy.current}</p>
          <p className="mt-2 font-mono text-app-title text-app-text tabular-nums">{formatMicros(usageTotals.costMicros)}</p>
          <p className="mt-1 text-app-small text-app-text-3">{copy.periodEnds(account.billingPeriod)}</p>
          <div className="mt-6 max-w-md">
            <div className="flex items-baseline justify-between gap-3 text-app-small">
              <span className="text-app-text-2">{copy.budget} · <span className="font-mono tabular-nums">{formatMicros(monthlyBudgetMicros)}</span></span>
              <span className="font-mono text-app-text-2 tabular-nums">{copy.used(used)}</span>
            </div>
            <div role="meter" aria-label={copy.budget} aria-valuenow={used} aria-valuemin={0} aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-app-hover">
              <div className="h-full rounded-full bg-app-accent" style={{ width: `${used}%` }} />
            </div>
          </div>
          <Link href="/usage" className={ghostAction("mt-4 -ml-3", "sm")}>
            {copy.seeUsage}
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
          </Link>
        </div>
        <dl className="space-y-5 border-t border-app-border bg-app-inset p-6 lg:border-t-0 lg:border-l">
          <div>
            <dt className="text-app-small text-app-text-3">{copy.plan}</dt>
            <dd className="mt-1 text-app-ui font-medium text-app-text">{account.plan}</dd>
          </div>
          <div>
            <dt className="text-app-small text-app-text-3">{copy.payment}</dt>
            <dd className="mt-1 text-app-ui text-app-text">{copy.noPayment}</dd>
          </div>
          <div>
            <button type="button" disabled aria-describedby="payment-later" className={secondaryAction("w-full")}>
              <HugeiconsIcon icon={CreditCardIcon} aria-hidden />
              {copy.addPayment}
            </button>
            <p id="payment-later" className="mt-2 text-app-small text-app-text-3">{copy.paymentLater}</p>
          </div>
        </dl>
      </div>
    </Card>
  );
}

export function BillingView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-6">
        <CurrentBill />
        <Card title={copy.history} description={copy.historySub}>
          <Table minWidth="min-w-lg">
            <THead>
              <Th>{cols.id}</Th>
              <Th>{cols.period}</Th>
              <Th align="right">{cols.amount}</Th>
              <Th align="right">{cols.status}</Th>
            </THead>
            <tbody>
              {invoices.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="font-mono text-app-code text-app-text-2">{inv.id}</Td>
                  <Td>{inv.period}</Td>
                  <Td align="right">{formatMicros(inv.amountMicros)}</Td>
                  <Td className="text-right"><Badge tone={statusTone[inv.status]}>{copy.status[inv.status]}</Badge></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
