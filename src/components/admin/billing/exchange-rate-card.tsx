import { Exchange01Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatWibStamp } from "@/lib/date-format";
import type { ExchangeRateEntry } from "@/lib/payments/finance-contract";
import { formatIdr } from "@/lib/price-format";
import { billingCopy } from "./billing-copy";
import { ExchangeRateForm } from "./exchange-rate-form";

const copy = billingCopy.rate;

/** The rate in force (newest row), the form to set a new one, and the last changes (PRD §5). */
export function ExchangeRateCard({ history }: { history: ExchangeRateEntry[] }) {
  const current = history[0];
  return (
    <Card title={copy.title} description={copy.description}>
      {current ? (
        <div className="border-b border-app-border px-6 py-5">
          <p className="text-app-small text-app-text-2">{copy.current}</p>
          <p className="mt-1 font-mono text-app-section text-app-text tabular-nums">{copy.value(formatIdr(current.idrPerUsd))}</p>
          <p className="mt-1 text-app-small text-app-text-3">
            {copy.setBy(current.setBy ?? copy.deletedAdmin, formatWibStamp(current.setAt))}
          </p>
        </div>
      ) : (
        <EmptyState icon={Exchange01Icon} title={copy.emptyTitle} body={copy.emptyBody} className="border-b border-app-border py-8" />
      )}
      <div className="p-6">
        <ExchangeRateForm />
      </div>
      {history.length > 1 && (
        <div className="border-t border-app-border">
          <h3 className="px-6 pt-5 pb-2 text-app-card text-app-text">{copy.history}</h3>
          <Table minWidth="min-w-lg">
            <THead>
              <Th>{copy.cols.at}</Th>
              <Th align="right">{copy.cols.rate}</Th>
              <Th>{copy.cols.by}</Th>
            </THead>
            <tbody>
              {history.map((entry) => (
                <Tr key={entry.setAt}>
                  <Td className="font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatWibStamp(entry.setAt)}</Td>
                  <Td align="right">{formatIdr(entry.idrPerUsd)}</Td>
                  <Td className="max-w-56 truncate text-app-text-2">{entry.setBy ?? copy.deletedAdmin}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
