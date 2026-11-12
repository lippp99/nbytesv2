// Admin Audit log page (PRD admin-users-audit §4). Read-only: there is no endpoint that changes audit rows.

export const AUDIT_FILTERS = ["all", "login", "actions"] as const;
export type AuditFilter = (typeof AUDIT_FILTERS)[number];
export const AUDIT_PAGE_SIZE = 50;

/** Sign-in and account events of the admin; every other type is an action on users, prices or settings. */
export const LOGIN_AUDIT_TYPES = [
  "code_sent", "code_send_failed", "code_failed", "totp_failed", "login_success", "logout", "totp_enrolled",
  "backup_code_used", "invited", "locked",
] as const;

/** What the target column points at, resolved on the server so the page never shows a bare id it could explain. */
export type AuditTarget =
  | { kind: "user"; id: string; email: string | null }
  | { kind: "rate"; idrPerUsd: number | null }
  | { kind: "model"; id: string }
  | { kind: "admin"; email: string | null }
  | null;

export type AuditEntry = {
  id: string;
  at: string;
  /** null: no admin was identified (e.g. a wrong code for an unknown email). */
  adminEmail: string | null;
  type: string;
  target: AuditTarget;
  reason: string | null;
  /** null for rows written before U3, or without the trusted IP header. */
  ipMasked: string | null;
};

export type AuditPage = { entries: AuditEntry[]; page: number; pages: number; total: number };

export function parseAuditFilter(value: unknown): AuditFilter {
  return AUDIT_FILTERS.find((filter) => filter === value) ?? "all";
}

/** The audit URL for a group and page; "all" and page 1 are implied. */
export function auditHref(filter: AuditFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("type", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}
