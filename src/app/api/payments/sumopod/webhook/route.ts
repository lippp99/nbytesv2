import { parseWebhook } from "@/lib/payments/sumopod-contract";
import { logServerError } from "@/lib/server/auth/request-guard";
import { applyWebhook } from "@/lib/server/payments/apply-webhook";
import { paymentsEnv } from "@/lib/server/payments/payments-env";
import { verifySvix } from "@/lib/server/payments/svix-signature";

// Sumopod webhook (PRD gateway-api §11, gateway-pricing-billing §6.3). No session and no Origin check: the svix
// signature is the only proof. The raw body is read once, verified, then parsed. Must answer 2xx within 10 s [P8].

const MAX_BODY_BYTES = 64 * 1024;
const reply = (status: number) => Response.json({ ok: status < 300 }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const { webhookSecret } = paymentsEnv();
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply(413);
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return reply(413);
    const headers = {
      id: request.headers.get("svix-id") ?? "",
      timestamp: request.headers.get("svix-timestamp") ?? "",
      signature: request.headers.get("svix-signature") ?? "",
    };
    if (!headers.id || headers.id.length > 255 || !verifySvix(webhookSecret, headers, rawBody)) return reply(401);

    const event = parseWebhook(safeJson(rawBody));
    if (!event) {
      console.error("[payments] verified webhook with an unexpected body");
      return reply(400);
    }
    if (event.eventType === "payment.test") return reply(200); // "Save & Test" in Sumopod settings: no action
    await applyWebhook(headers.id, event);
    return reply(200);
  } catch (error) {
    // Nothing was committed (one transaction), so a resend from the Sumopod Webhooks tab can apply it later.
    logServerError(error);
    return reply(503);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
