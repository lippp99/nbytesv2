"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { AUDIT_FILTERS, type AuditFilter, auditHref } from "@/lib/admin-auth/audit-contract";
import { auditCopy, filterLabels } from "./audit-copy";

const options = AUDIT_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/**
 * Event group kept in the URL (?type=), so the server renders the list and a reload keeps it. Resets to page 1.
 * The push runs in a transition so `pending` can say the list is loading (docs: guides/interactive-apps).
 */
export function AuditFilterControl({ value }: { value: AuditFilter }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex flex-wrap items-center gap-3">
      <span role="status" className="text-app-small text-app-text-2">{pending ? auditCopy.loadingResults : ""}</span>
      <Segmented label={auditCopy.filterLabel} options={options} value={value} className="flex-wrap"
        onChange={(next) => startTransition(() => router.push(auditHref(next), { scroll: false }))} />
    </span>
  );
}
