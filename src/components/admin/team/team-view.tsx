import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/app-kit/badge";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatUtc } from "@/lib/date-format";
import { roleScopes, teamCopy as copy } from "./team-copy";
import { adminRows } from "./team-data";

function InviteButton() {
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" disabled aria-describedby="invite-later" className={primaryAction()}>
        <HugeiconsIcon icon={UserAdd01Icon} aria-hidden />
        {copy.invite}
      </button>
      <p id="invite-later" className="text-app-small text-app-text-3">{copy.inviteLater}</p>
    </div>
  );
}

export function TeamView() {
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={<InviteButton />} />
      <div className="space-y-6">
        <Card title={copy.admins}>
          <Table minWidth="min-w-2xl">
            <THead>
              <Th>{cols.admin}</Th>
              <Th>{cols.role}</Th>
              <Th>{cols.totp}</Th>
              <Th>{cols.lastLogin}</Th>
            </THead>
            <tbody>
              {adminRows.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <span className="block truncate text-app-text">{a.name}</span>
                    <span className="block truncate text-app-small text-app-text-3">{a.email}</span>
                  </Td>
                  <Td>{a.role === "Owner" ? <Badge tone="accent">{a.role}</Badge> : a.role}</Td>
                  <Td>
                    <Badge tone={a.totp === "on" ? "success" : "warning"}>{a.totp === "on" ? copy.totpOn : copy.totpPending}</Badge>
                  </Td>
                  <Td className="font-mono text-app-code text-app-text-2 tabular-nums">
                    {a.lastLoginAt ? formatUtc(a.lastLoginAt) : copy.never}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card title={copy.roles} description={copy.rolesSub}>
          <dl className="divide-y divide-app-border">
            {roleScopes.map((r) => (
              <div key={r.role} className="grid gap-1 px-6 py-4 sm:grid-cols-4 sm:gap-6">
                <dt className="text-app-ui font-medium text-app-text">{r.role}</dt>
                <dd className="text-app-ui text-app-text-2 sm:col-span-3">{r.scope}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
