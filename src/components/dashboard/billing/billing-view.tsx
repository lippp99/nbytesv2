import { Exchange01Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import type { UserBalance, UserDeposit } from "@/lib/payments/deposit-contract";
import { formatMicros, formatSignedMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billing as copy } from "./billing-copy";
import { DepositForm } from "./deposit-form";
import { DepositHistory } from "./deposit-history";

export type BillingViewProps = {
  balance: UserBalance;
  /** null while the admin has not set a rate: deposits are closed (PRD §5.6). */
  idrPerUsd: number | null;
  history: { deposits: UserDeposit[]; page: number; pages: number };
  /** The deposit Sumopod just sent the user back from, if it is theirs. */
  returned: UserDeposit | null;
};

function ReturnNotice({ deposit }: { deposit: UserDeposit }) {
  const ok = deposit.state === "paid";
  const text = deposit.state === "paid" ? copy.returned.paid(formatMicros(deposit.creditMicros)) : copy.returned[deposit.state];
  const bad = deposit.state === "failed" || deposit.state === "stuck";
  return (
    <p role="status" className={cn("rounded-app-control border px-4 py-3 text-app-ui",
      ok ? "border-app-border bg-app-surface text-app-text" : "border-app-border bg-app-inset text-app-text-2",
      bad && "border-app-danger/40 text-app-text")}>
      {text}
    </p>
  );
}

function BalanceCard({ balance }: { balance: UserBalance }) {
  const available = balance.balanceMicros - balance.heldMicros;
  return (
    <Card>
      <div className="p-6">
        <p className="text-app-ui text-app-text-2">{copy.balance}</p>
        <p className={cn("mt-2 font-mono text-app-title tabular-nums", available < 0 ? "text-app-danger" : "text-app-text")}>
          {formatSignedMicros(available)}
        </p>
        {balance.heldMicros > 0 && <p className="mt-1 text-app-small text-app-text-2">{copy.held(formatMicros(balance.heldMicros))}</p>}
        <p className="mt-1 text-app-small text-app-text-3">{available < 0 ? copy.negative : copy.balanceNote}</p>
      </div>
    </Card>
  );
}

/** Prepaid: the balance, the deposit form, then the user's deposits. Usage history comes with the gateway. */
export function BillingView({ balance, idrPerUsd, history, returned }: BillingViewProps) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        {returned && <ReturnNotice deposit={returned} />}
        <BalanceCard balance={balance} />
        <Card title={copy.deposit.title} description={copy.deposit.description}>
          <div id="deposit">
            {idrPerUsd ? (
              <DepositForm idrPerUsd={idrPerUsd} />
            ) : (
              <EmptyState icon={Exchange01Icon} title={copy.deposit.closedTitle} body={copy.deposit.closedBody} />
            )}
          </div>
        </Card>
        <DepositHistory {...history} />
      </div>
    </>
  );
}
