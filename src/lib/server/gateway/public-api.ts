import "server-only";
import { randomUUID } from "node:crypto";
import { KEY_RATE_WINDOW_SECONDS, readApiKey } from "@/lib/gateway/keys/api-key-contract";
import { type GatewayErrorCode, gatewayErrorStatus, isGatewayErrorCode, openAiErrorBody } from "@/lib/gateway/error-contract";
import { logServerError } from "../auth/request-guard";
import { hit } from "../auth/rate-limit";
import { AppError, rateLimitedError } from "../errors";
import { currentPlatformSettings } from "../platform/settings";
import { type KeyOwner, authenticateApiKey } from "./api-keys";

// Guard of the public /api/v1 endpoints (PRD gateway-api §7 steps 1–3, §9, §10). No Origin check and no CORS: SDK
// clients send none, and the key is meant for servers (§12). readGuardedJson is for dashboard endpoints only.


/** Every answer carries nbytes' own request id (§9); a request that never got a row gets a fresh one. */
export const newRequestId = (): string => randomUUID();

export function gatewayJson(body: unknown, status: number, requestId: string, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "x-request-id": requestId, ...headers } });
}

/** §7.1: JSON only, size checked before parsing; too large -> 413, not JSON -> 400. Bytes feed the hold estimate. */
export async function readPublicJson(request: Request, maxBytes: number): Promise<{ json: unknown; bytes: number }> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new AppError("invalid_request", 400);
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) throw new AppError("request_too_large", 413);
  // shortcut: a chunked body without Content-Length is read whole before the size check; stream it if abused.
  const text = await request.text();
  const bytes = Buffer.byteLength(text);
  if (bytes > maxBytes) throw new AppError("request_too_large", 413);
  try {
    return { json: JSON.parse(text), bytes };
  } catch {
    throw new AppError("invalid_request", 400);
  }
}

/** Maintenance (admin Settings) closes the API and the Playground: 503, the envelope every client already handles. */
export async function assertNotInMaintenance(): Promise<void> {
  if ((await currentPlatformSettings()).maintenance) throw new AppError("service_unavailable", 503);
}

/** §7 steps 2–3: not in maintenance, the key's owner, then the admin's requests per minute per key. */
export async function authenticatePublic(request: Request): Promise<KeyOwner> {
  const { maintenance, keyRpm } = await currentPlatformSettings();
  if (maintenance) throw new AppError("service_unavailable", 503);
  const key = readApiKey(request.headers);
  if (!key) throw new AppError("invalid_api_key", 401);
  const owner = await authenticateApiKey(key);
  const wait = await hit(`gateway:key:${owner.keyId}`, keyRpm, KEY_RATE_WINDOW_SECONDS);
  if (wait) throw rateLimitedError(wait);
  return owner;
}

/** AppError with a gateway code -> its OpenAI envelope; anything else is logged and answered 503. */
export function gatewayErrorResponse(error: unknown, requestId: string): Response {
  const known = error instanceof AppError && isGatewayErrorCode(error.code) ? error : null;
  if (!known) logServerError(error instanceof AppError ? (error.cause ?? error) : error);
  const code: GatewayErrorCode = known ? (known.code as GatewayErrorCode) : "service_unavailable";
  const headers: Record<string, string> = known?.retryAfterSeconds ? { "Retry-After": String(known.retryAfterSeconds) } : {};
  return gatewayJson(openAiErrorBody(code, known?.details.param ?? null), gatewayErrorStatus(code), requestId, headers);
}
