import Link from "next/link";
import { Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Pagination } from "@/components/app-kit/pagination";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { type AdminUserRow, type UserFilter, type UsersPage, usersHref } from "@/lib/admin-users/user-admin-contract";
import { formatUtc } from "@/lib/date-format";
import { formatMicros, formatSignedMicros } from "@/lib/price-format";
import { StatusDialog } from "./status-dialog";
import { usersCopy as copy, userStatusBadge } from "./users-copy";
import { UsersFeedback } from "./users-feedback";
import { UsersToolbar } from "./users-toolbar";

const mono = "font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums";
type UsersViewProps = { data: UsersPage; filter: UserFilter; search: string | null };

function Row({ user }: { user: AdminUserRow }) {
  const badge = userStatusBadge[user.status];
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (
    <Tr>
      <Td className="max-w-72">
        {name && <span className="block truncate text-app-text">{name}</span>}
        <span className={name ? "block truncate text-app-small text-app-text-2" : "block truncate text-app-text"}>{user.email}</span>
      </Td>
      <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
      <Td align="right">
        <span className="block">{formatSignedMicros(user.balanceMicros)}</span>
        {user.heldMicros > 0 && <span className="block text-app-small text-app-text-3">{copy.held(formatMicros(user.heldMicros))}</span>}
      </Td>
      <Td align="right">{formatMicros(user.spentMonthMicros)}</Td>
      <Td align="right">{user.activeKeys}</Td>
      <Td className={mono}>{user.lastLoginAt ? formatUtc(user.lastLoginAt) : copy.never}</Td>
      <Td className={mono}>{formatUtc(user.createdAt).slice(0, 10)}</Td>
      <Td><StatusDialog userId={user.id} email={user.email} status={user.status} /></Td>
    </Tr>
  );
}

/** Real accounts (PRD admin-users-audit §3): search and status in the URL, 25 per page, suspend behind a dialog. */
export function UsersView({ data, filter, search }: UsersViewProps) {
  const cols = copy.cols;
  const filtered = filter !== "all" || search !== null;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      {/* keyed on the search, so "reset" (a link to the bare URL) also empties the search field */}
      <UsersToolbar key={search ?? ""} filter={filter} search={search} />
      <UsersFeedback>
        <Card title={copy.count(data.total)}>
          {data.users.length === 0 ? (
            filtered
              ? <EmptyState icon={Search01Icon} title={copy.noMatch.title} body={copy.noMatch.body}
                  action={<Link href="/admin/users" className={secondaryAction()}>{copy.noMatch.reset}</Link>} />
              : <EmptyState icon={UserGroupIcon} title={copy.empty.title} body={copy.empty.body} />
          ) : (
            <Table minWidth="min-w-5xl">
              <THead>
                <Th>{cols.user}</Th>
                <Th>{cols.status}</Th>
                <Th align="right">{cols.balance}</Th>
                <Th align="right">{cols.spent}</Th>
                <Th align="right">{cols.keys}</Th>
                <Th>{cols.lastLogin}</Th>
                <Th>{cols.joined}</Th>
                <Th>{cols.action}</Th>
              </THead>
              <tbody>{data.users.map((u) => <Row key={u.id} user={u} />)}</tbody>
            </Table>
          )}
          <Pagination page={data.page} pages={data.pages} href={(page) => usersHref(filter, search, page)} labels={copy.pagination} />
        </Card>
      </UsersFeedback>
    </>
  );
}
