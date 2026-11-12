import { parseExchangeRateBody } from "@/lib/payments/deposit-contract";
import { AppError } from "@/lib/server/errors";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { setExchangeRate } from "@/lib/server/payments/exchange-rate";

// Admin sets "1 USD = X rupiah" (PRD gateway-pricing-billing §5; owner, 2026-11-11: endpoint now, page later).
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const body = parseExchangeRateBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await setExchangeRate(session.admin.id, body.idrPerUsd, clientIpKey(request));
    return authJson({ ok: true, idrPerUsd: body.idrPerUsd }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
