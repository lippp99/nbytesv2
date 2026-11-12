import "server-only";
import { parseCreatePaymentResponse, type SumopodPayment } from "@/lib/payments/sumopod-contract";
import { paymentsEnv } from "./payments-env";

// Sumopod Managed Payment, Create Payment (PRD gateway-pricing-billing §6.3 [P1, P6]).

const TIMEOUT_MS = 15_000;
// B8: QRIS (0.7% + Rp 300). Upper case as in the curl sample; whether the API also wants "qris" is not proven yet.
const PAYMENT_METHOD = "QRIS";

export type CreatePaymentInput = { orderId: string; amountIdr: number; expiresInHours: number; returnUrl: string };

/**
 * `refused`: Sumopod answered and did not create the payment (4xx). `unknown`: no usable answer (network, timeout, 5xx,
 * odd body), so the payment may exist; the deposit stays pending and a verified webhook can still settle it.
 */
export class SumopodError extends Error {
  constructor(readonly kind: "refused" | "unknown", message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SumopodError";
  }
}

export async function createPayment(input: CreatePaymentInput): Promise<SumopodPayment> {
  const { apiKey, apiBaseUrl } = paymentsEnv();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/v1/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({
        order_id: input.orderId,
        amount: input.amountIdr,
        currency: "IDR",
        expires_in_hours: input.expiresInHours,
        success_return_url: input.returnUrl,
        cancel_return_url: input.returnUrl,
        payment_method_type_code: PAYMENT_METHOD,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new SumopodError("unknown", "create payment: no response", { cause: error });
  }
  // Status only: the body may echo request data, so it stays out of the log.
  if (response.status >= 400 && response.status < 500) throw new SumopodError("refused", `create payment: HTTP ${response.status}`);
  if (!response.ok) throw new SumopodError("unknown", `create payment: HTTP ${response.status}`);
  const payment = parseCreatePaymentResponse(await response.json().catch(() => null));
  if (!payment) throw new SumopodError("unknown", "create payment: unexpected response body");
  if (payment.orderId !== input.orderId || payment.amount !== input.amountIdr) {
    throw new SumopodError("unknown", "create payment: order_id or amount differs from the request");
  }
  return payment;
}
