import "server-only";
import { headers } from "next/headers";
import { AppError } from "../errors";
import { authEnv } from "./auth-env";
import { type ClientInfo, maskIp, normalizeCountry } from "./client-info";
import { hmac } from "./crypto";

const MAX_BODY_BYTES = 1024;
const forbidden = () => new AppError("unavailable", 403); // no reason given to the client

/** Route Handlers get no built-in Origin check (only Server Actions do), so every auth POST calls this. */
export function isSameOrigin(request: Request): boolean {
  return request.headers.get("origin") === authEnv().appOrigin;
}

/** Origin + JSON content type + 1 KB body, then the parsed JSON (or invalid_input). */
export async function readGuardedJson(request: Request): Promise<unknown> {
  if (!isSameOrigin(request)) throw forbidden();
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw forbidden();
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) throw new AppError("invalid_input", 400);
  // shortcut: a chunked body without Content-Length is read whole before the size check; stream it if abused.
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new AppError("invalid_input", 400);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("invalid_input", 400);
  }
}

/** Client IP from the one trusted proxy header (AUTH_TRUSTED_IP_HEADER), or undefined without it. */
function clientIp(request: Pick<Request, "headers">): string | undefined {
  const { ipHeader } = authEnv();
  // Last hop: for a single-value header (cf-connecting-ip) it is the value; for x-forwarded-for it is the
  // address our own proxy appended.
  return ipHeader ? request.headers.get(ipHeader)?.split(",").at(-1)?.trim() || undefined : undefined;
}

/**
 * Masked client IP of the current request ("103.47.xx.xx") for the admin audit log (PRD admin-users-audit U3).
 * null outside a request (scripts) or without the trusted IP header.
 */
export async function requestIpMasked(): Promise<string | null> {
  let current: Headers;
  try {
    current = await headers();
  } catch {
    return null;
  }
  return maskIp(clientIp({ headers: current }));
}

/** Keyed hash of the client IP; clients without the trusted header share one "unknown" key. */
export function clientIpKey(request: Request): string {
  const ip = clientIp(request);
  return ip ? hmac(authEnv().hashKey, `ip:${ip}`) : "unknown";
}

/**
 * What a new session records about the client. The country header is trusted only behind Cloudflare (the trusted
 * IP header is cf-connecting-ip); anywhere else a visitor could send it themselves.
 */
export function clientInfo(request: Request): ClientInfo {
  const behindCloudflare = authEnv().ipHeader === "cf-connecting-ip";
  return {
    userAgent: request.headers.get("user-agent"),
    ipMasked: maskIp(clientIp(request)),
    country: behindCloudflare ? normalizeCountry(request.headers.get("cf-ipcountry")) : null,
  };
}

export function emailKey(email: string): string {
  return hmac(authEnv().hashKey, `email:${email}`);
}

/** JSON reply for the auth endpoints; never cached. */
export function authJson(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** AppError -> its contract body; anything else is logged without request data and answered 503 unavailable. */
export function authErrorResponse(error: unknown): Response {
  const known = error instanceof AppError ? error : null;
  if (!known || known.status >= 500) logServerError(known?.cause ?? error);
  if (!known) return authJson({ ok: false, error: { code: "unavailable" } }, 503);
  const headers: Record<string, string> = known.retryAfterSeconds ? { "Retry-After": String(known.retryAfterSeconds) } : {};
  return authJson({ ok: false, error: { code: known.code, ...known.details } }, known.status, headers);
}

// Error name and driver code only: messages can echo query values (emails), so they stay out of prod logs.
export function logServerError(error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  const code = (err as { code?: unknown }).code;
  const detail = process.env.NODE_ENV === "development" ? err.stack : "";
  console.error(`[auth] ${err.name}${code ? ` (${String(code)})` : ""}`, detail);
}
