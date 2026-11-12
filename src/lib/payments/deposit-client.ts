import type { CreatedDeposit } from "./deposit-contract";

// Billing page call to start a deposit (POST /api/payments/deposits). Components use this, never raw fetch.

export type DepositError =
  | { kind: "offline" }
  | { kind: "unauthorized" }
  | { kind: "invalid_input" }
  | { kind: "rate_limited"; retryAfterMinutes: number }
  | { kind: "unavailable" };
export type DepositResult = { ok: true; deposit: CreatedDeposit } | { ok: false; error: DepositError };

export async function createDeposit(amountIdr: number): Promise<DepositResult> {
  let response: Response;
  try {
    response = await fetch("/api/payments/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountIdr }),
    });
  } catch {
    return { ok: false, error: { kind: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable" } };
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data?.ok === true) return { ok: true, deposit: data.deposit };
  const error = data?.error;
  if (error?.code === "rate_limited") {
    return { ok: false, error: { kind: "rate_limited", retryAfterMinutes: Math.max(1, error.retryAfterMinutes ?? 1) } };
  }
  if (error?.code === "unauthorized" || error?.code === "invalid_input") return { ok: false, error: { kind: error.code } };
  return { ok: false, error: { kind: "unavailable" } };
}
