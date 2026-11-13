import Link from "next/link";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { appFocus } from "@/components/app-kit/button";
import { requestsHref } from "@/lib/admin-gateway/request-log-contract";
import { type ModelUsage, type UserUsage, shareBp } from "@/lib/admin-gateway/usage-contract";
import { grossMargin } from "@/lib/admin-overview-contract";
import { formatCents, formatSignedCents } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { usageCopy } from "./usage-copy";
import { count, percent } from "@/components/admin/shared/report-format";

const c = usageCopy.cols;
const link = cn("rounded-app-inner text-app-accent-text underline-offset-4 hover:underline", appFocus);
const logHref = (search: string) => requestsHref({ filter: "all", costPending: false, search });

type Money = Pick<ModelUsage, "inputTokens" | "outputTokens" | "chargeMicros" | "costMicros" | "knownCostChargeMicros">;

/** Token and money cells shared by both tables; share is this row's part of all tokens of the month. */
function UsageCells({ row, allTokens }: { row: Money; allTokens: number }) {
  const tokens = row.inputTokens + row.outputTokens;
  const share = shareBp(tokens, allTokens);
  const margin = grossMargin(row.knownCostChargeMicros, row.costMicros).micros;
  return (
    <>
      <Td align="right">{count(row.inputTokens)}</Td>
      <Td align="right">{count(row.outputTokens)}</Td>
      <Td align="right" className="text-app-text">{count(tokens)}</Td>
      <Td align="right">{share === null ? "—" : percent(share)}</Td>
      <Td align="right">{formatCents(row.chargeMicros)}</Td>
      <Td align="right">{formatCents(row.costMicros)}</Td>
      <Td align="right" className={margin < 0 ? "text-app-danger" : undefined}>{formatSignedCents(margin)}</Td>
    </>
  );
}

function UsageHeads() {
  return (
    <>
      <Th align="right">{c.input}</Th><Th align="right">{c.output}</Th><Th align="right">{c.total}</Th>
      <Th align="right">{c.share}</Th><Th align="right">{c.charge}</Th><Th align="right">{c.cost}</Th>
      <Th align="right">{c.margin}</Th>
    </>
  );
}

export function ModelUsageTable({ rows, allTokens }: { rows: ModelUsage[]; allTokens: number }) {
  return (
    <Table minWidth="min-w-6xl">
      <THead>
        <Th>{c.model}</Th><Th align="right">{c.requests}</Th><Th align="right">{c.failed}</Th>
        <Th align="right">{c.accounts}</Th><UsageHeads />
      </THead>
      <tbody>
        {rows.map((m) => (
          <Tr key={m.modelId}>
            <Td className="max-w-80">
              {m.name && <span className="block truncate text-app-text">{m.name}</span>}
              <Link href={logHref(m.modelId)} className={cn(link, "block truncate font-mono text-app-code", m.name && "text-app-small")}>
                {m.modelId}
              </Link>
            </Td>
            <Td align="right">{count(m.requests)}</Td>
            <Td align="right" className={m.failed ? "text-app-danger" : undefined}>{count(m.failed)}</Td>
            <Td align="right">{count(m.users)}</Td>
            <UsageCells row={m} allTokens={allTokens} />
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

export function UserUsageTable({ rows, allTokens }: { rows: UserUsage[]; allTokens: number }) {
  return (
    <Table minWidth="min-w-6xl">
      <THead>
        <Th>{c.user}</Th><Th align="right">{c.requests}</Th><Th align="right">{c.models}</Th><UsageHeads />
      </THead>
      <tbody>
        {rows.map((u) => (
          <Tr key={u.email ?? "deleted"}>
            <Td className="max-w-64 truncate">
              {u.email
                ? <Link href={logHref(u.email)} className={link}>{u.email}</Link>
                : <span className="text-app-text-3">{usageCopy.users.deleted}</span>}
            </Td>
            <Td align="right">{count(u.requests)}</Td>
            <Td align="right">{count(u.models)}</Td>
            <UsageCells row={u} allTokens={allTokens} />
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
