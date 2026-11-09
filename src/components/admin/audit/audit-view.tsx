import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import { auditCopy as copy } from "./audit-copy";
import { auditRows } from "./audit-data";

const mono = "font-mono text-app-code";

export function AuditView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        <Table minWidth="min-w-3xl">
          <THead>
            <Th>{cols.at}</Th>
            <Th>{cols.actor}</Th>
            <Th>{cols.action}</Th>
            <Th>{cols.target}</Th>
            <Th>{cols.ip}</Th>
          </THead>
          <tbody>
            {auditRows.map((r) => (
              <Tr key={r.id}>
                <Td className={`${mono} whitespace-nowrap text-app-text-2 tabular-nums`}>{formatUtc(r.at)}</Td>
                <Td className="max-w-56 truncate">{r.actor}</Td>
                <Td className={mono}>{r.action}</Td>
                <Td className={`${mono} text-app-text-2`}>{r.target}</Td>
                <Td className={`${mono} text-app-text-2 tabular-nums`}>{r.ip}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
