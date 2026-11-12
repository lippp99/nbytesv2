import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCreatePaymentResponse, parseWebhook } from "./sumopod-contract.ts";

// Examples copied from the Sumopod dashboard Quick Start (PRD gateway-pricing-billing [P7], [P8]).
const CREATE_RESPONSE = {
  payment_id: "uuid", order_id: "INV-2026-001", amount: 50000, fee: 650, net_amount: 49350,
  payment_link_url: "https://pay.sumopod.com/pay/uuid", payment_code: "1308300301295957",
  payment_code_type: "ACCOUNT_NUMBER", payment_channel_used: "BRI.VA", status: "pending",
  expires_at: "2026-01-01T12:00:00Z",
};
const COMPLETED = {
  event_type: "payment.completed",
  data: {
    payment_id: "uuid", order_id: "INV-2026-001", amount: 50000, fee: 650, net_amount: 49350, status: "completed",
    payment_method: "qris", paid_at: "2026-06-18T12:00:00Z", settled_at: "2026-06-20T12:00:00Z",
    completed_at: "2026-06-20T12:00:00Z",
  },
};

test("create response: the documented example parses", () => {
  const payment = parseCreatePaymentResponse(CREATE_RESPONSE);
  assert.equal(payment?.paymentId, "uuid");
  assert.equal(payment?.amount, 50000);
  assert.equal(payment?.fee, 650);
  assert.equal(payment?.paymentLinkUrl, "https://pay.sumopod.com/pay/uuid");
  assert.equal(payment?.expiresAt.toISOString(), "2026-01-01T12:00:00.000Z");
});

test("create response: refused without an https link, id, amount or expiry", () => {
  assert.equal(parseCreatePaymentResponse({ ...CREATE_RESPONSE, payment_link_url: "http://pay.sumopod.com/x" }), null);
  assert.equal(parseCreatePaymentResponse({ ...CREATE_RESPONSE, payment_id: "" }), null);
  assert.equal(parseCreatePaymentResponse({ ...CREATE_RESPONSE, amount: "50000" }), null);
  assert.equal(parseCreatePaymentResponse({ ...CREATE_RESPONSE, expires_at: "soon" }), null);
  assert.equal(parseCreatePaymentResponse(null), null);
});

test("webhook: completed event parses with paid_at", () => {
  const event = parseWebhook(COMPLETED);
  assert.ok(event && event.eventType === "payment.completed");
  assert.equal(event.orderId, "INV-2026-001");
  assert.equal(event.amount, 50000);
  assert.equal(event.paymentMethod, "qris");
  assert.equal(event.paidAt?.toISOString(), "2026-06-18T12:00:00.000Z");
});

test("webhook: test event needs no data; unknown events and missing ids are refused", () => {
  assert.deepEqual(parseWebhook({ event_type: "payment.test" }), { eventType: "payment.test" });
  assert.equal(parseWebhook({ ...COMPLETED, event_type: "payment.refunded" }), null);
  assert.equal(parseWebhook({ event_type: "payment.failed", data: { ...COMPLETED.data, order_id: 5 } }), null);
  assert.equal(parseWebhook({ event_type: "payment.expired" }), null);
});
