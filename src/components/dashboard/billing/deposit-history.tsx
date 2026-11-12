import Link from "next/link";
import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/app-kit/badge";
import { ghostAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import type { UserDeposit } from "@/lib/payments/deposit-contract";
import { formatIdr, formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billing, depositBadge } from "./billing-copy";

const copy = billing.history;
const cols = copy.cols;
const href = (page: number) => (page <= 1 ? "/billing" : `/billing?page=${page}`);

function Step({ page, enabled, label }: { page: number; enabled: boolean; label: string }) {
  if (!enabled) {
    return <span aria-disabled="true" className={cn(secondaryAction("", "sm"), "pointer-events-none opacity-50")}>{label}</span>;
  }
  return <Link href={href(page)} scroll={false} className={secondaryAction("", "sm")}>{label}</Link>;
}

function Pagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={copy.pagination} className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-6 py-4">
      <p className="text-app-small text-app-text-2 tabular-nums">{copy.pageOf(page, pages)}</p>
      <div className="flex gap-2">
        <Step page={page - 1} enabled={page > 1} label={copy.previous} />
        <Step page={page + 1} enabled={page < pages} label={copy.next} />
      </div>
    </nav>
  );
}

type HistoryProps = { deposits: UserDeposit[]; page: number; pages: number };

/** The user's own deposits; one still payable links back to its Sumopod page. */
export function DepositHistory({ deposits, page, pages }: HistoryProps) {
  return (
    <Card title={copy.title} description={copy.description}>
      {deposits.length === 0 ? (
        <EmptyState icon={Invoice01Icon} title={copy.emptyTitle} body={copy.emptyBody} />
      ) : (
        <Table minWidth="min-w-3xl">
          <THead>
            <Th>{cols.at}</Th>
            <Th align="right">{cols.amount}</Th>
            <Th align="right">{cols.paid}</Th>
            <Th align="right">{cols.rate}</Th>
            <Th align="right">{cols.credit}</Th>
            <Th>{cols.status}</Th>
          </THead>
          <tbody>
            {deposits.map((d) => {
              const badge = depositBadge[d.state];
              return (
                <Tr key={d.id}>
                  <Td className="font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatUtc(d.createdAt)}</Td>
                  <Td align="right">{formatIdr(d.amountIdr)}</Td>
                  <Td align="right">{formatIdr(d.totalIdr)}</Td>
                  <Td align="right">{formatIdr(d.idrPerUsd)}</Td>
                  <Td align="right">{formatMicros(d.creditMicros)}</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {d.paymentLinkUrl && <a href={d.paymentLinkUrl} className={ghostAction("", "sm")}>{copy.resume}</a>}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pages={pages} />
    </Card>
  );
}
