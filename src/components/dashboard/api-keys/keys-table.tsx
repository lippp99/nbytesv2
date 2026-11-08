"use client";

import { useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { formatMicros } from "@/lib/price-format";
import { apiKeysCopy as copy } from "./api-keys-copy";
import type { ApiKey } from "@/components/dashboard/shared/dashboard-data";

const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateLabel.format(new Date(iso));
const textButton = `rounded-chip px-2 py-1 ${focusRing}`;
const iconButton =
  `inline-flex size-9 items-center justify-center rounded-chip text-muted-foreground hover:bg-muted hover:text-destructive ${focusRing}`;

function Budget({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.budgetMicros === null) return <span className="text-muted-foreground">{copy.noLimit}</span>;
  const used = Math.min(100, (apiKey.spentMicros / apiKey.budgetMicros) * 100);
  return (
    <span className="block w-36">
      <span className="font-mono text-code">{formatMicros(apiKey.spentMicros)} / {formatMicros(apiKey.budgetMicros)}</span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span className={`block h-full rounded-full ${used >= 85 ? "bg-destructive" : "bg-accent-mark"}`} style={{ width: `${used}%` }} />
      </span>
    </span>
  );
}

/** Trash button that turns into an inline "revoke?" confirmation. */
function RevokeControl({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} aria-label={`${copy.revoke} ${apiKey.name}`} className={iconButton}>
        <HugeiconsIcon icon={Delete02Icon} aria-hidden className="size-4" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-muted-foreground">{copy.confirmRevoke}</span>
      <button type="button" onClick={() => onRevoke(apiKey.id)} className={`${textButton} font-medium text-destructive hover:bg-destructive/10`}>
        {copy.confirm}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className={`${textButton} hover:bg-muted`}>{copy.cancel}</button>
    </span>
  );
}

export function KeysTable({ keys, onRevoke }: { keys: ApiKey[]; onRevoke: (id: string) => void }) {
  const cols = copy.cols;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl text-sm">
        <thead className="text-muted-foreground">
          <tr className="text-left">
            {[cols.name, cols.key, cols.created, cols.lastUsed, cols.budget].map((c, i) => (
              <th key={c} scope="col" className={`py-3 font-normal ${i === 0 ? "pl-4 sm:pl-5" : ""}`}>{c}</th>
            ))}
            <th scope="col" className="py-3 pr-4 sm:pr-5"><span className="sr-only">{cols.actions}</span></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} className="border-t border-border">
              <td className="py-3 pl-4 font-medium sm:pl-5">{k.name}</td>
              <td className="py-3 font-mono text-code text-muted-foreground">{k.preview}</td>
              <td className="py-3">{formatDate(k.createdAt)}</td>
              <td className="py-3">{k.lastUsedAt ? formatDate(k.lastUsedAt) : <span className="text-muted-foreground">{copy.never}</span>}</td>
              <td className="py-3"><Budget apiKey={k} /></td>
              <td className="py-3 pr-4 text-right sm:pr-5"><RevokeControl apiKey={k} onRevoke={onRevoke} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
