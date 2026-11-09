"use client";

import { useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ApiKey } from "@/components/dashboard/shared/dashboard-data";
import { dangerAction, ghostAction, iconAction } from "@/components/app-kit/button";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { apiKeysCopy as copy } from "./api-keys-copy";

const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateLabel.format(new Date(iso));

function Budget({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.budgetMicros === null) {
    return <span className="text-app-text-3">{formatMicros(apiKey.spentMicros)} · {copy.noLimit}</span>;
  }
  const used = Math.min(100, (apiKey.spentMicros / apiKey.budgetMicros) * 100);
  return (
    <span className="block w-40">
      <span className="font-mono text-app-code tabular-nums">
        {formatMicros(apiKey.spentMicros)}<span className="text-app-text-3"> / {formatMicros(apiKey.budgetMicros)}</span>
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-app-hover">
        <span className={cn("block h-full rounded-full", used >= 85 ? "bg-app-danger" : "bg-app-accent")} style={{ width: `${used}%` }} />
      </span>
    </span>
  );
}

/** Trash button that turns into an inline confirmation in the same cell; nothing is removed on the first click. */
function RevokeControl({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} aria-label={`${copy.revoke} ${apiKey.name}`}
        className={iconAction("hover:text-app-danger")}>
        <HugeiconsIcon icon={Delete02Icon} aria-hidden />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-app-small text-app-text-2">{copy.confirmRevoke}</span>
      <button type="button" onClick={() => setConfirming(false)} className={ghostAction("", "sm")}>{copy.cancel}</button>
      <button type="button" onClick={() => onRevoke(apiKey.id)} className={dangerAction("", "sm")}>{copy.confirm}</button>
    </span>
  );
}

export function KeysTable({ keys, onRevoke }: { keys: ApiKey[]; onRevoke: (id: string) => void }) {
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
            <Td className="font-mono text-app-code text-app-text-2">{k.preview}</Td>
            <Td className="text-app-text-2">{formatDate(k.createdAt)}</Td>
            <Td className="text-app-text-2">{k.lastUsedAt ? formatDate(k.lastUsedAt) : <span className="text-app-text-3">{copy.never}</span>}</Td>
            <Td><Budget apiKey={k} /></Td>
            <Td className="text-right"><RevokeControl apiKey={k} onRevoke={onRevoke} /></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
