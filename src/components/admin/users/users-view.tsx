"use client";

import { useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/app-kit/badge";
import { dangerAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { TextInput } from "@/components/app-kit/field";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatMicros } from "@/lib/price-format";
import { usersCopy as copy, userStatusBadge } from "./users-copy";
import { type UserRow, type UserStatus, userRows } from "./users-data";

function Row({ user, onToggle }: { user: UserRow; onToggle: () => void }) {
  const badge = userStatusBadge[user.status];
  const suspended = user.status === "suspended";
  return (
    <Tr>
      <Td>
        <span className="block truncate text-app-text">{user.name}</span>
        <span className="block truncate text-app-small text-app-text-3">{user.email}</span>
      </Td>
      <Td>{user.plan}</Td>
      <Td align="right">{formatMicros(user.balanceMicros)}</Td>
      <Td align="right">{formatMicros(user.spentMonthMicros)}</Td>
      <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
      <Td className="font-mono text-app-code text-app-text-2 tabular-nums">{user.joinedAt}</Td>
      <Td>
        <button type="button" onClick={onToggle} aria-label={`${suspended ? copy.restore : copy.suspend} ${user.name}`}
          className={suspended ? secondaryAction(undefined, "sm") : dangerAction(undefined, "sm")}>
          {suspended ? copy.restore : copy.suspend}
        </button>
      </Td>
    </Tr>
  );
}

export function UsersView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Record<string, UserStatus>>({});
  const users = userRows.map((u) => ({ ...u, status: status[u.id] ?? u.status }));
  const q = query.trim().toLowerCase();
  const shown = users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q));
  const cols = copy.cols;

  function toggle(user: UserRow) {
    setStatus((prev) => ({ ...prev, [user.id]: user.status === "suspended" ? "active" : "suspended" }));
  }

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <HugeiconsIcon icon={Search01Icon} aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-text-3" />
          <TextInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={query}
            onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <p aria-live="polite" className="text-app-small text-app-text-3">{copy.count(shown.length, users.length)}</p>
      </div>
      <Card>
        {shown.length === 0 ? (
          <EmptyState icon={Search01Icon} title={copy.empty} body={copy.emptyBody} />
        ) : (
          <Table minWidth="min-w-4xl">
            <THead>
              <Th>{cols.user}</Th>
              <Th>{cols.plan}</Th>
              <Th align="right">{cols.balance}</Th>
              <Th align="right">{cols.spent}</Th>
              <Th>{cols.status}</Th>
              <Th>{cols.joined}</Th>
              <Th>{cols.action}</Th>
            </THead>
            <tbody>{shown.map((u) => <Row key={u.id} user={u} onToggle={() => toggle(u)} />)}</tbody>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-app-small text-app-text-3">{copy.note}</p>
    </>
  );
}
