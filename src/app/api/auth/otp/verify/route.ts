import { DEFAULT_AFTER_LOGIN, parseOtpVerifyBody, safeNextPath } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { verifyCode } from "@/lib/server/auth/otp/verify-code";
import {
  authErrorResponse, authJson, clientInfo, clientIpKey, emailKey, readGuardedJson,
} from "@/lib/server/auth/request-guard";

// Step 2: check the code, create the account if new, set the session cookie.
export async function POST(request: Request) {
  try {
    const body = parseOtpVerifyBody(await readGuardedJson(request));
    if (!body) throw new AppError("invalid_input", 400);
    await verifyCode({
      email: body.email,
      code: body.code,
      emailHash: emailKey(body.email),
      ipHash: clientIpKey(request),
      client: clientInfo(request),
    });
    return authJson({ ok: true, redirect: safeNextPath(body.next) ?? DEFAULT_AFTER_LOGIN }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
