// Admin Users page and status change (PRD admin-users-audit §3). Shared by the server, the page and the client.

export const USER_FILTERS = ["all", "active", "suspended"] as const;
export type UserFilter = (typeof USER_FILTERS)[number];
export type UserStatus = Exclude<UserFilter, "all">;
export const USERS_PAGE_SIZE = 25;
export const SEARCH_MAX = 100;
export const REASON_MAX = 200; // U5

export type AdminUserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  balanceMicros: number;
  heldMicros: number;
  /** Charged this calendar month (UTC), from gateway_requests. */
  spentMonthMicros: number;
  activeKeys: number;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UsersPage = { users: AdminUserRow[]; page: number; pages: number; total: number };

/** Body of POST /api/admin/users/{id}/status: suspending needs a reason (U5), restoring does not. */
export type UserStatusBody = { status: UserStatus; reason: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseUserFilter(value: unknown): UserFilter {
  return USER_FILTERS.find((filter) => filter === value) ?? "all";
}

/** ?q= trimmed and capped; empty -> null (no search). */
export function parseUserSearch(value: unknown): string | null {
  const q = typeof value === "string" ? value.trim().slice(0, SEARCH_MAX) : "";
  return q || null;
}

export function parseUserStatusBody(json: unknown): UserStatusBody | null {
  if (!isRecord(json) || (json.status !== "active" && json.status !== "suspended")) return null;
  const reason = typeof json.reason === "string" ? json.reason.trim() : "";
  if (reason.length > REASON_MAX) return null;
  if (json.status === "suspended" && !reason) return null;
  return { status: json.status, reason: reason || null };
}

/** The users URL for a search, status and page; page 1 is implied, so a new search always starts at the top. */
export function usersHref(filter: UserFilter, search: string | null, page = 1): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}
