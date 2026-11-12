import "server-only";
import { type SQL, and, count, desc, eq, ilike, or } from "drizzle-orm";
import {
  type AdminRequestRow, type RequestQuery, type RequestsPage, REQUESTS_PAGE_SIZE,
} from "@/lib/admin-gateway/request-log-contract";
import { db } from "../db/client";
import { apiKeys, gatewayRequests, users } from "../db/schema";

// Read-only list for the admin Request log (PRD admin-requests-upstream §3). Callers check the admin session.

/** LIKE pattern for a literal search text: %, _ and \ in the text match only themselves. */
const contains = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The x-request-id a user reports (nbytes' own id) finds its row exactly. */
const idMatch = (text: string) => (UUID.test(text) ? eq(gatewayRequests.id, text) : undefined);

function whereOf(query: RequestQuery): SQL | undefined {
  const pattern = query.search && contains(query.search);
  return and(
    query.filter === "all" ? undefined : eq(gatewayRequests.state, query.filter),
    query.costPending ? eq(gatewayRequests.costStatus, "pending") : undefined,
    pattern ? or(ilike(users.email, pattern), ilike(gatewayRequests.modelId, pattern), idMatch(query.search!)) : undefined,
  );
}

/** Newest first; the page is clamped to the last one. User and key are joined for the email and key name. */
export async function listRequests(query: RequestQuery): Promise<RequestsPage> {
  const where = whereOf(query);
  const [{ total }] = await db
    .select({ total: count() })
    .from(gatewayRequests)
    .leftJoin(users, eq(users.id, gatewayRequests.userId))
    .where(where);
  const pages = Math.max(1, Math.ceil(total / REQUESTS_PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const g = gatewayRequests;
  const rows = await db
    .select({
      id: g.id, createdAt: g.createdAt, email: users.email, keyName: apiKeys.name, keyPrefix: apiKeys.keyPrefix,
      modelId: g.modelId, stream: g.stream, state: g.state, statusCode: g.statusCode, errorCode: g.errorCode,
      upstreamErrorCode: g.upstreamErrorCode, upstreamFamily: g.upstreamFamily, truncated: g.truncated,
      latencyMs: g.latencyMs, inputTokens: g.inputTokens, outputTokens: g.outputTokens, holdMicros: g.holdMicros,
      chargeMicros: g.chargeMicros, surplusCostMicros: g.surplusCostMicros, surplusRequestId: g.surplusRequestId,
    })
    .from(g)
    .leftJoin(users, eq(users.id, g.userId))
    .leftJoin(apiKeys, eq(apiKeys.id, g.apiKeyId))
    .where(where)
    .orderBy(desc(g.createdAt))
    .limit(REQUESTS_PAGE_SIZE)
    .offset((page - 1) * REQUESTS_PAGE_SIZE);
  const out: AdminRequestRow[] = rows.map(({ createdAt, ...r }) => ({ ...r, at: createdAt.toISOString() }));
  return { rows: out, page, pages, total };
}
