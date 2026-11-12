import "server-only";
import { surplusApiKey, surplusOrigin } from "./gateway-env";

// HTTP calls to Surplus (PRD ai-gateway §4). The nbytes key goes only in these headers.

const CATALOG_TIMEOUT_MS = 15_000;
/** D2a: also sent per request as a fallback; the stricter of key setting and header applies [S26]. */
const MIN_DISCOUNT = "25";

/** Public catalog GET /v1/models (no key needed [S5]); the `data` array, or an error if the answer is unusable. */
export async function fetchSurplusCatalog(): Promise<unknown[]> {
  const response = await fetch(`${surplusOrigin()}/v1/models`, {
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Surplus catalog: HTTP ${response.status}`);
  const json: unknown = await response.json();
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) throw new Error("Surplus catalog: no data array");
  return data;
}

/**
 * One inference call. No automatic retry, ever (§7.10: a repeat is a new generation and a new bill [S18]). No timeout of
 * our own either: Surplus documents none, and the platform limit (maxDuration) waits on hosting (A6). `signal` is the
 * user's request, so a user who disconnects cancels the call.
 */
export function postSurplus(path: `/v1/${string}`, body: unknown, signal: AbortSignal): Promise<Response> {
  return fetch(`${surplusOrigin()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${surplusApiKey()}`,
      "X-Min-Discount": MIN_DISCOUNT,
    },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
}

/** nbytes' own balance at Surplus (GET /v1/payments/balance, buyer key [S2]); the raw JSON, checked by the caller. */
export async function fetchSurplusBalance(): Promise<unknown> {
  const response = await fetch(`${surplusOrigin()}/v1/payments/balance`, {
    headers: { Authorization: `Bearer ${surplusApiKey()}` },
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Surplus balance: HTTP ${response.status}`);
  return response.json();
}
