// Errors of the public gateway API (PRD gateway-api §9). The /api/v1 envelope mimics OpenAI so SDKs read it:
// {"error": {"type", "code", "message", "param"}}. Messages are generic; upstream detail stays in server logs.

export type GatewayErrorCode =
  | "invalid_request" | "invalid_api_key" | "insufficient_balance" | "key_budget_exceeded" | "account_suspended"
  | "model_not_found" | "request_too_large" | "rate_limited" | "service_unavailable" | "model_unavailable"
  | "upstream_error"
  // Playground only (PRD dashboard-playground §5.1): no session, or a request from another origin.
  | "unauthorized" | "forbidden";

type ErrorSpec = { status: number; type: string; message: string };

// English, like the SDKs that read these messages.
const SPECS: Record<GatewayErrorCode, ErrorSpec> = {
  invalid_request: { status: 400, type: "invalid_request_error", message: "The request is not valid." },
  invalid_api_key: { status: 401, type: "authentication_error", message: "Invalid or revoked API key." },
  insufficient_balance: { status: 402, type: "insufficient_quota", message: "Your balance is too low for this request." },
  key_budget_exceeded: { status: 402, type: "insufficient_quota", message: "This key reached its monthly budget." },
  account_suspended: { status: 403, type: "permission_error", message: "This account is suspended." },
  model_not_found: { status: 404, type: "invalid_request_error", message: "The model does not exist or is not available." },
  request_too_large: { status: 413, type: "invalid_request_error", message: "The request body is too large." },
  rate_limited: { status: 429, type: "rate_limit_error", message: "Too many requests. Retry after a moment." },
  service_unavailable: { status: 503, type: "api_error", message: "The service is temporarily unavailable." },
  model_unavailable: { status: 503, type: "api_error", message: "The model is temporarily unavailable." },
  upstream_error: { status: 502, type: "api_error", message: "The model provider returned an error." },
  unauthorized: { status: 401, type: "authentication_error", message: "Sign in again." },
  forbidden: { status: 403, type: "permission_error", message: "This request is not allowed." },
};

export const gatewayErrorStatus = (code: GatewayErrorCode) => SPECS[code].status;
/** Every code with its status and type, read-only, in declaration order (the API Docs table is built from it). */
export const gatewayErrors = (Object.keys(SPECS) as GatewayErrorCode[]).map((code) => ({ code, ...SPECS[code] }));
export const isGatewayErrorCode = (code: string): code is GatewayErrorCode => Object.hasOwn(SPECS, code);

export function openAiErrorBody(code: GatewayErrorCode, param: string | null = null) {
  const { type, message } = SPECS[code];
  return { error: { type, code, message, param } };
}

export type UpstreamFailure = { code: GatewayErrorCode; alertAdmin: boolean };

/**
 * §9 mapping of a Surplus error (status + `code` from its envelope [S2]) to what the user gets. alertAdmin marks the
 * cases that are nbytes' fault (our Surplus key or credit), never the user's.
 */
export function mapUpstreamError(status: number, code: string | null): UpstreamFailure {
  if (status === 401 || status === 403) return { code: "service_unavailable", alertAdmin: true };
  if (status === 402) return { code: "service_unavailable", alertAdmin: true };
  if (status === 429 || code === "rate_limit_exceeded") return { code: "rate_limited", alertAdmin: false };
  if (code === "no_sellers_for_model" || code === "minimum_discount_not_met") return { code: "model_unavailable", alertAdmin: false };
  if (code === "no_healthy_sellers" || code === "route_deadline_exceeded") return { code: "model_unavailable", alertAdmin: false };
  if (code === "insufficient_credit" || code === "budget_exceeded") return { code: "service_unavailable", alertAdmin: true };
  if (status === 400) return { code: "invalid_request", alertAdmin: false };
  if (status === 404 || status === 503) return { code: "model_unavailable", alertAdmin: false };
  return { code: "upstream_error", alertAdmin: false };
}
