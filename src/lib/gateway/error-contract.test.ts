import assert from "node:assert/strict";
import { test } from "node:test";
import { gatewayErrorStatus, mapUpstreamError, openAiErrorBody } from "./error-contract.ts";

test("OpenAI envelope with code and param", () => {
  assert.deepEqual(openAiErrorBody("invalid_request", "messages"), {
    error: { type: "invalid_request_error", code: "invalid_request", message: "The request is not valid.", param: "messages" },
  });
  assert.equal(gatewayErrorStatus("insufficient_balance"), 402);
  assert.equal(gatewayErrorStatus("upstream_error"), 502);
});

test("PRD gateway-api §9: Surplus errors -> user errors", () => {
  const cases: [number, string | null, string, boolean][] = [
    [400, "invalid_request", "invalid_request", false],
    [401, "invalid_api_key", "service_unavailable", true],
    [403, "model_not_in_key_scope", "service_unavailable", true],
    [402, "insufficient_credit", "service_unavailable", true],
    [402, "budget_exceeded", "service_unavailable", true],
    [404, "no_sellers_for_model", "model_unavailable", false],
    [404, "minimum_discount_not_met", "model_unavailable", false],
    [429, "rate_limit_exceeded", "rate_limited", false],
    [503, "no_healthy_sellers", "model_unavailable", false],
    [503, "route_deadline_exceeded", "model_unavailable", false],
    [500, null, "upstream_error", false],
    [502, null, "upstream_error", false],
    // HTTP 200 carrying an error body (long-running requests [S6]) is mapped by its code.
    [200, "insufficient_credit", "service_unavailable", true],
    [200, "no_healthy_sellers", "model_unavailable", false],
    [200, null, "upstream_error", false],
  ];
  for (const [status, code, want, alert] of cases) {
    assert.deepEqual(mapUpstreamError(status, code), { code: want, alertAdmin: alert }, `${status} ${code}`);
  }
});
