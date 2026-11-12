"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { AUDIT_FILTERS, type AuditFilter, auditHref } from "@/lib/admin-auth/audit-contract";
import { auditCopy, filterLabels } from "./audit-copy";

const options = AUDIT_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/** Event group kept in the URL (?type=), so the server renders the list and a reload keeps it. Resets to page 1. */
export function AuditFilterControl({ value }: { value: AuditFilter }) {
  const router = useRouter();
  return (
    <Segmented label={auditCopy.filterLabel} options={options} value={value} className="flex-wrap"
      onChange={(next) => router.push(auditHref(next), { scroll: false })} />
  );
}
