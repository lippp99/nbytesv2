import type { CreateKeyBody, CreatedKey } from "./api-key-contract";

// API Keys page calls (POST /api/keys, DELETE /api/keys/{id}). Components use this, never raw fetch.

export type ApiKeyError =
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "unauthorized" }
  | { kind: "invalid_input" }
  | { kind: "key_limit_reached" }
  | { kind: "not_found" };
export type ApiKeyResult<T> = ({ ok: true } & T) | { ok: false; error: ApiKeyError };

const KNOWN = ["unauthorized", "invalid_input", "key_limit_reached", "not_found"] as const;

async function call<T>(path: string, init: RequestInit): Promise<ApiKeyResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    return { ok: false, error: { kind: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" } };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return data as { ok: true } & T;
  const code = data?.error?.code;
  return { ok: false, error: { kind: KNOWN.includes(code) ? code : "unavailable" } };
}

export function createApiKey(body: CreateKeyBody): Promise<ApiKeyResult<{ key: CreatedKey }>> {
  return call("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export function revokeApiKey(id: string): Promise<ApiKeyResult<object>> {
  return call(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
}
