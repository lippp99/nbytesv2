import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/app-kit/badge";
import { CopyButton } from "@/components/copy-button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { Pagination } from "@/components/app-kit/pagination";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import type { DepositFilter, DepositsPage } from "@/lib/payments/finance-contract";
import { formatIdr, formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billingCopy, stateBadge } from "./billing-copy";
import { DepositFilterControl } from "./deposit-filter";

const copy = billingCopy.deposits;
const cols = copy.cols;

function href(filter: DepositFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/billing?${query}` : "/admin/billing";
}

/** Every deposit with what was paid, the locked rate and the credit; stuck ones are flagged for B9. */
export function DepositsTable({ data, filter }: { data: DepositsPage; filter: DepositFilter }) {
  const empty = data.deposits.length === 0;
  return (
    <Card title={copy.title} description={copy.description} action={<DepositFilterControl value={filter} />}>
      {empty ? (
        filter === "all"
          ? <EmptyState icon={Invoice01Icon} title={copy.emptyTitle} body={copy.emptyBody} />
          : <EmptyState icon={Invoice01Icon} title={copy.emptyFilteredTitle} body={copy.emptyFilteredBody} />
      ) : (
        <Table minWidth="min-w-4xl">
          <THead>
            <Th>{cols.at}</Th>
            <Th>{cols.order}</Th>
            <Th>{cols.customer}</Th>
            <Th align="right">{cols.paid}</Th>
            <Th align="right">{cols.rate}</Th>
            <Th align="right">{cols.credit}</Th>
            <Th align="right">{cols.fee}</Th>
            <Th>{cols.status}</Th>
          </THead>
          <tbody>
            {data.deposits.map((d) => {
              const badge = stateBadge[d.state];
              return (
                <Tr key={d.id}>
                  <Td className="font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatUtc(d.createdAt)}</Td>
                  {/* Sumopod lists deposits by this order id: 8 characters to read, the copy button carries the full one. */}
                  <Td className="font-mono text-app-code text-app-text-2">
                    <span className="flex items-center">
                      {d.id.slice(0, 8)}
                      <CopyButton text={d.id} label={copy.copyOrder} copiedLabel={copy.copiedOrder} failedLabel={copy.copyFailed}
                        iconOnly className="-my-1" />
                    </span>
                  </Td>
                  <Td className={cn("max-w-56 truncate", !d.email && "text-app-text-3")}>{d.email ?? copy.deletedAccount}</Td>
                  <Td align="right">{formatIdr(d.totalIdr)}</Td>
                  <Td align="right">{formatIdr(d.idrPerUsd)}</Td>
                  <Td align="right">{formatMicros(d.creditMicros)}</Td>
                  <Td align="right">{d.providerFeeIdr === null ? "–" : formatIdr(d.providerFeeIdr)}</Td>
                  <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pagination page={data.page} pages={data.pages} href={(page) => href(filter, page)}
        labels={{ nav: copy.pagination, pageOf: copy.pageOf, previous: copy.previous, next: copy.next }} />
    </Card>
  );
}
