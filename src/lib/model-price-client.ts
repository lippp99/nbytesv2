// Admin call to add, reprice or turn off a curated model (POST /api/admin/models). Components use this, never raw fetch.
import type { ModelPriceBody } from "./gateway/catalog-contract";

export type ModelPriceError = "offline" | "unauthorized" | "invalid_input" | "model_not_found" | "blocked" | "unavailable";
export type ModelPriceResult = { ok: true } | { ok: false; error: ModelPriceError };

const KNOWN: ModelPriceError[] = ["unauthorized", "invalid_input", "model_not_found", "blocked"];

export async function saveModelPrice(body: ModelPriceBody): Promise<ModelPriceResult> {
  let response: Response;
  try {
    response = await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return { ok: true };
  const code = data?.error?.code;
  return { ok: false, error: KNOWN.includes(code) ? code : "unavailable" };
}
