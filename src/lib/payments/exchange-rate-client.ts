// Admin call to set the exchange rate (POST /api/admin/exchange-rate). Components use this, never raw fetch.

export type RateError = "offline" | "unauthorized" | "invalid_input" | "unavailable";
export type RateResult = { ok: true } | { ok: false; error: RateError };

export async function saveExchangeRate(idrPerUsd: number): Promise<RateResult> {
  let response: Response;
  try {
    response = await fetch("/api/admin/exchange-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idrPerUsd }),
    });
  } catch {
    return { ok: false, error: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return { ok: true };
  const code = data?.error?.code;
  return { ok: false, error: code === "unauthorized" || code === "invalid_input" ? code : "unavailable" };
}
