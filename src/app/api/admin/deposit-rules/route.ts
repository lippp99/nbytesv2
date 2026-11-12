import { parseDepositRulesBody } from "@/lib/payments/deposit-contract";
import { AppError } from "@/lib/server/errors";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { setDepositRules } from "@/lib/server/payments/deposit-rules";

// Admin sets the deposit minimum, maximum and fee (PRD gateway-pricing-billing B2, B3).
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const body = parseDepositRulesBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await setDepositRules(session.admin.id, body, clientIpKey(request));
    return authJson({ ok: true, rules: body }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
