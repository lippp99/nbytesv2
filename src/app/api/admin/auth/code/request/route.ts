import { parseAdminEmailBody } from "@/lib/admin-auth/admin-auth-contract";
import { CODE_RESEND_SECONDS } from "@/lib/server/admin-auth/admin-rules";
import { requestAdminCode } from "@/lib/server/admin-auth/login/request-code";
import { authErrorResponse, authJson, clientIpKey, emailKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { AppError } from "@/lib/server/errors";

// Admin step 1: same 202 for every email, admin or not (PRD backend-auth-admin §4).
export async function POST(request: Request) {
  try {
    const body = parseAdminEmailBody(await readGuardedJson(request));
    if (!body) throw new AppError("invalid_input", 400);
    await requestAdminCode(body.email, emailKey(body.email), clientIpKey(request));
    return authJson({ ok: true, resendAfter: CODE_RESEND_SECONDS }, 202);
  } catch (error) {
    return authErrorResponse(error);
  }
}
