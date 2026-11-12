import { SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Pagination } from "@/components/app-kit/pagination";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { type AuditEntry, type AuditFilter, type AuditPage, auditHref } from "@/lib/admin-auth/audit-contract";
import { formatUtc } from "@/lib/date-format";
import { formatIdr } from "@/lib/price-format";
import { actionLabels, auditCopy as copy } from "./audit-copy";
import { AuditFilterControl } from "./audit-filter";

const mono = "font-mono text-app-code";
const quiet = "text-app-text-3";

/** The target in words: an email, a model id or the rate that was set; a removed row says so instead of a bare id. */
function Target({ target }: { target: AuditEntry["target"] }) {
  if (!target) return <span className={quiet}>—</span>;
  if (target.kind === "model") return <span className={mono}>{target.id}</span>;
  if (target.kind === "rate") {
    return target.idrPerUsd === null ? <span className={quiet}>{copy.removed}</span> : <span className={mono}>{formatIdr(target.idrPerUsd)} / USD</span>;
  }
  if (target.kind === "admin") return target.email ? <span>{target.email}</span> : <span className={quiet}>{copy.removed}</span>;
  return target.email ? <span>{target.email}</span> : <span className={`${mono} ${quiet}`} title={target.id}>{copy.removed}</span>;
}

function Row({ entry }: { entry: AuditEntry }) {
  return (
    <Tr>
      <Td className={`${mono} whitespace-nowrap text-app-text-2 tabular-nums`}>{formatUtc(entry.at)}</Td>
      <Td className="max-w-56 truncate">{entry.adminEmail ?? <span className={quiet}>{copy.noAdmin}</span>}</Td>
      <Td>{actionLabels[entry.type] ?? <span className={mono}>{entry.type}</span>}</Td>
      <Td className="max-w-64 truncate"><Target target={entry.target} /></Td>
      <Td className="max-w-72 py-3 text-app-text-2">{entry.reason ?? <span className={quiet}>—</span>}</Td>
      <Td className={`${mono} whitespace-nowrap text-app-text-2 tabular-nums`}>{entry.ipMasked ?? <span className={quiet}>—</span>}</Td>
    </Tr>
  );
}

/** Read-only history from admin_audit_events (PRD admin-users-audit §4): no edit or delete control exists. */
export function AuditView({ data, filter }: { data: AuditPage; filter: AuditFilter }) {
  const cols = copy.cols;
  const empty = filter === "all" ? copy.empty : copy.emptyFiltered;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card title={copy.count(data.total)} action={<AuditFilterControl value={filter} />}>
        {data.entries.length === 0 ? (
          <EmptyState icon={SecurityCheckIcon} title={empty.title} body={empty.body} />
        ) : (
          <Table minWidth="min-w-5xl">
            <THead>
              <Th>{cols.at}</Th>
              <Th>{cols.actor}</Th>
              <Th>{cols.action}</Th>
              <Th>{cols.target}</Th>
              <Th>{cols.reason}</Th>
              <Th>{cols.ip}</Th>
            </THead>
            <tbody>{data.entries.map((e) => <Row key={e.id} entry={e} />)}</tbody>
          </Table>
        )}
        <Pagination page={data.page} pages={data.pages} href={(page) => auditHref(filter, page)} labels={copy.pagination} />
        <p className="border-t border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">{copy.ipNote}</p>
      </Card>
    </>
  );
}
