import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// AI gateway tables (PRD gateway-api §5, §13; gateway-pricing-billing §7, §10, §12). Money in integer micro-USD.
const at = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => bigint(name, { mode: "number" });

/** §5: only the HMAC of the key is stored; the full key is shown once. Deleting the user removes its keys. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    monthlyBudgetMicros: money("monthly_budget_micros"),
    lastUsedAt: at("last_used_at"),
    revokedAt: at("revoked_at"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_key_hash_idx").on(t.keyHash),
    index("api_keys_user_id_idx").on(t.userId),
    check("api_keys_budget_check", sql`${t.monthlyBudgetMicros} is null or ${t.monthlyBudgetMicros} > 0`),
  ],
);

/**
 * Curated catalog (D4): only active rows can be called. List prices come from the Surplus catalog, sell prices are
 * list × (1 + markup) rounded up to a whole micro-dollar (billing §7.1). Prices are per 1M tokens.
 */
export const modelPrices = pgTable(
  "model_prices",
  {
    modelId: text("model_id").primaryKey(),
    name: text("name").notNull(),
    contextLength: integer("context_length"),
    maxCompletionTokens: integer("max_completion_tokens"),
    supportsImages: boolean("supports_images").notNull(),
    listInputMicros: money("list_input_micros").notNull(),
    listOutputMicros: money("list_output_micros").notNull(),
    markupBp: integer("markup_bp").notNull().default(0),
    inputMicros: money("input_micros").notNull(),
    outputMicros: money("output_micros").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: at("created_at").notNull().defaultNow(),
    updatedAt: at("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("model_prices_markup_check", sql`${t.markupBp} > -10000 and ${t.markupBp} <= 30000`),
    check("model_prices_prices_check", sql`${t.inputMicros} >= 0 and ${t.outputMicros} >= 0`),
  ],
);

export const GATEWAY_REQUEST_STATES = ["pending", "succeeded", "failed"] as const;

/**
 * One row per inference request (billing §10). `hold_micros` is taken when the row is created (pending); `charge_micros`
 * is set when it settles. `surplus_cost_micros` NULL means unknown (never 0); cost_status says if it needs reconciling.
 * No prompt or answer text is stored (gateway-api §12).
 */
export const gatewayRequests = pgTable(
  "gateway_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
    modelId: text("model_id").notNull(),
    endpoint: text("endpoint").notNull(),
    stream: boolean("stream").notNull(),
    state: text("state", { enum: GATEWAY_REQUEST_STATES }).notNull().default("pending"),
    holdMicros: money("hold_micros").notNull(),
    chargeMicros: money("charge_micros"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    surplusRequestId: text("surplus_request_id"),
    surplusCostMicros: money("surplus_cost_micros"),
    costStatus: text("cost_status", { enum: ["known", "pending"] }),
    statusCode: integer("status_code"),
    errorCode: text("error_code"),
    // Telemetry from Surplus (PRD admin-requests-upstream §5, R3); stored for the admin, never sent to the user.
    upstreamErrorCode: text("upstream_error_code"),
    upstreamFamily: text("upstream_family"),
    truncated: boolean("truncated"),
    latencyMs: integer("latency_ms"),
    createdAt: at("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("gateway_requests_user_id_idx").on(t.userId),
    index("gateway_requests_api_key_created_idx").on(t.apiKeyId, t.createdAt),
    index("gateway_requests_created_at_idx").on(t.createdAt),
    index("gateway_requests_state_created_idx").on(t.state, t.createdAt),
    index("gateway_requests_cost_pending_idx").on(t.createdAt).where(sql`${t.costStatus} = 'pending'`),
    check("gateway_requests_state_check", sql`${t.state} in ('pending', 'succeeded', 'failed')`),
    check("gateway_requests_cost_status_check", sql`${t.costStatus} is null or ${t.costStatus} in ('known', 'pending')`),
    check("gateway_requests_money_check", sql`${t.holdMicros} >= 0 and (${t.chargeMicros} is null or ${t.chargeMicros} >= 0)`),
  ],
);
