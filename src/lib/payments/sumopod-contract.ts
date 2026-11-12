// Shapes Sumopod sends us (PRD gateway-pricing-billing §6.3, [P7] create response, [P8] webhook payload).
// Parsed once here; anything missing or of the wrong type is refused, never guessed.

export type SumopodPayment = {
  paymentId: string;
  orderId: string;
  amount: number;
  fee: number | null;
  netAmount: number | null;
  paymentLinkUrl: string;
  paymentCode: string | null;
  paymentCodeType: string | null;
  paymentChannelUsed: string | null;
  expiresAt: Date;
};

export const WEBHOOK_EVENTS = ["payment.completed", "payment.failed", "payment.expired", "payment.test"] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export type SumopodWebhook =
  | { eventType: "payment.test" }
  | {
      eventType: Exclude<WebhookEventType, "payment.test">;
      paymentId: string;
      orderId: string;
      amount: number;
      fee: number | null;
      netAmount: number | null;
      paymentMethod: string | null;
      paidAt: Date | null;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 512) => (typeof value === "string" && value && value.length <= max ? value : null);
const whole = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null);
const date = (value: unknown) => {
  const parsed = typeof value === "string" ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};
const httpsUrl = (value: unknown) => {
  const url = text(value, 2048);
  return url?.startsWith("https://") ? url : null;
};

/** Create Payment response; null if a field we rely on is missing (the user is never sent to an unknown link). */
export function parseCreatePaymentResponse(json: unknown): SumopodPayment | null {
  if (!isRecord(json)) return null;
  const paymentId = text(json.payment_id);
  const orderId = text(json.order_id);
  const amount = whole(json.amount);
  const paymentLinkUrl = httpsUrl(json.payment_link_url);
  const expiresAt = date(json.expires_at);
  if (!paymentId || !orderId || amount === null || !paymentLinkUrl || !expiresAt) return null;
  return {
    paymentId, orderId, amount, paymentLinkUrl, expiresAt,
    fee: whole(json.fee),
    netAmount: whole(json.net_amount),
    paymentCode: text(json.payment_code),
    paymentCodeType: text(json.payment_code_type),
    paymentChannelUsed: text(json.payment_channel_used),
  };
}

/** Webhook body after the signature check; null for an unknown event or a payment event without its ids. */
export function parseWebhook(json: unknown): SumopodWebhook | null {
  if (!isRecord(json)) return null;
  const eventType = WEBHOOK_EVENTS.find((event) => event === json.event_type);
  if (!eventType) return null;
  if (eventType === "payment.test") return { eventType };
  const data = isRecord(json.data) ? json.data : null;
  const paymentId = text(data?.payment_id);
  const orderId = text(data?.order_id);
  const amount = whole(data?.amount);
  if (!data || !paymentId || !orderId || amount === null) return null;
  return {
    eventType, paymentId, orderId, amount,
    fee: whole(data.fee),
    netAmount: whole(data.net_amount),
    paymentMethod: text(data.payment_method, 64),
    paidAt: date(data.paid_at),
  };
}
