"use client";

import { useState, useSyncExternalStore } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { dangerAction, ghostAction, iconAction } from "@/components/app-kit/button";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { type UserApiKey, budgetState } from "@/lib/gateway/keys/api-key-contract";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { apiKeysCopy as copy } from "./api-keys-copy";

// Local time of the viewer: the server does not know the time zone, so dates render only after hydration.
const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const timeLabel = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const noop = () => () => {};
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

function When({ iso, withTime }: { iso: string; withTime?: boolean }) {
  const client = useIsClient();
  const label = client ? (withTime ? timeLabel : dateLabel).format(new Date(iso)) : " ";
  return <time dateTime={iso} className="tabular-nums">{label}</time>;
}

// Neutral bar while there is room; status colours only with their word next to them (dashboard-design §3).
const barTone = { none: "", ok: "bg-app-text-3", near: "bg-app-warning", reached: "bg-app-danger" };

function Budget({ apiKey }: { apiKey: UserApiKey }) {
  const { spentThisMonthMicros: spent, monthlyBudgetMicros: budget } = apiKey;
  const state = budgetState(spent, budget);
  if (budget === null) return <span className="text-app-text-3">{formatMicros(spent)} · {copy.noLimit}</span>;
  const used = Math.min(100, (spent / budget) * 100);
  return (
    <span className="block w-44">
      <span className="font-mono text-app-code tabular-nums">
        {formatMicros(spent)}<span className="text-app-text-3"> / {formatMicros(budget)}</span>
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-app-hover">
        <span className={cn("block h-full rounded-full", barTone[state])} style={{ width: `${used}%` }} />
      </span>
      {state === "near" && <span className="mt-1 block text-app-small text-app-warning">{copy.near}</span>}
      {state === "reached" && <span className="mt-1 block text-app-small text-app-danger">{copy.reached}</span>}
    </span>
  );
}

type RevokeProps = { apiKey: UserApiKey; busy: boolean; locked: boolean; onRevoke: (id: string) => void };

/** Trash button that turns into an inline confirmation in the same cell; nothing is revoked on the first click. */
function RevokeControl({ apiKey, busy, locked, onRevoke }: RevokeProps) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} disabled={locked} aria-label={`${copy.revoke} ${apiKey.name}`}
        className={iconAction("hover:text-app-danger")}>
        <HugeiconsIcon icon={Delete02Icon} aria-hidden />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-app-small text-app-text-2">{copy.confirmRevoke}</span>
      <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={ghostAction("", "sm")}>{copy.cancel}</button>
      <button type="button" onClick={() => onRevoke(apiKey.id)} disabled={locked} aria-busy={busy || undefined}
        className={dangerAction("", "sm")}>{copy.confirm}</button>
    </span>
  );
}

type KeysTableProps = { keys: UserApiKey[]; busyId: string | null; onRevoke: (id: string) => void };

export function KeysTable({ keys, busyId, onRevoke }: KeysTableProps) {
  const cols = copy.cols;
  return (
    <Table minWidth="min-w-3xl">
      <THead>
        <Th>{cols.name}</Th>
        <Th>{cols.key}</Th>
        <Th>{cols.created}</Th>
        <Th>{cols.lastUsed}</Th>
        <Th>{cols.budget}</Th>
        <Th align="right"><span className="sr-only">{cols.actions}</span></Th>
      </THead>
      <tbody>
        {keys.map((k) => (
          <Tr key={k.id}>
            <Td className="font-medium">{k.name}</Td>
            <Td className="font-mono text-app-code text-app-text-2">{k.keyPrefix}…</Td>
            <Td className="text-app-text-2"><When iso={k.createdAt} /></Td>
            <Td className="text-app-text-2">
              {k.lastUsedAt ? <When iso={k.lastUsedAt} withTime /> : <span className="text-app-text-3">{copy.never}</span>}
            </Td>
            <Td><Budget apiKey={k} /></Td>
            <Td className="text-right">
              <RevokeControl apiKey={k} busy={busyId === k.id} locked={busyId !== null} onRevoke={onRevoke} />
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
