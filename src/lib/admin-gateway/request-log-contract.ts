// Admin Request log (PRD admin-requests-upstream §3). Shared by the server query and the page.

export const REQUEST_FILTERS = ["all", "succeeded", "failed", "pending"] as const;
export type RequestFilter = (typeof REQUEST_FILTERS)[number];
export const REQUESTS_PAGE_SIZE = 50;
const SEARCH_MAX = 100;

export type RequestQuery = { filter: RequestFilter; costPending: boolean; search: string | null; page: number };

export type AdminRequestRow = {
  id: string;
  at: string;
  /** null: the account was deleted (the row keeps no email). */
  email: string | null;
  keyName: string | null;
  keyPrefix: string | null;
  modelId: string;
  stream: boolean;
  state: Exclude<RequestFilter, "all">;
  statusCode: number | null;
  errorCode: string | null;
  upstreamErrorCode: string | null;
  upstreamFamily: string | null;
  truncated: boolean | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  holdMicros: number;
  chargeMicros: number | null;
  /** null = no cost known; never read as 0 (billing §10). costStatus says if it is still to be looked up. */
  surplusCostMicros: number | null;
  costStatus: "known" | "pending" | null;
  surplusRequestId: string | null;
};

export type RequestsPage = { rows: AdminRequestRow[]; page: number; pages: number; total: number };

/** Charge minus Surplus cost, only when both are known (R2); may be negative. */
export function marginMicros(row: Pick<AdminRequestRow, "chargeMicros" | "surplusCostMicros">): number | null {
  return row.chargeMicros === null || row.surplusCostMicros === null ? null : row.chargeMicros - row.surplusCostMicros;
}

export function parseRequestQuery(params: Record<string, string | string[] | undefined>, page: number): RequestQuery {
  const filter = REQUEST_FILTERS.find((f) => f === params.status) ?? "all";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, SEARCH_MAX) : "";
  return { filter, costPending: params.cost === "pending", search: q || null, page };
}

/** The request log URL for a query; defaults are left out. */
export function requestsHref(query: Omit<RequestQuery, "page">, page = 1): string {
  const params = new URLSearchParams();
  if (query.search) params.set("q", query.search);
  if (query.filter !== "all") params.set("status", query.filter);
  if (query.costPending) params.set("cost", "pending");
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/requests?${text}` : "/admin/requests";
}
