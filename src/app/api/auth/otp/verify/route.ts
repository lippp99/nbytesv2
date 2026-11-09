import { DEFAULT_AFTER_LOGIN, parseOtpVerifyBody, safeNextPath } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { verifyCode } from "@/lib/server/auth/otp/verify-code";
import {
  authErrorResponse, authJson, clientInfo, clientIpKey, emailKey, readGuardedJson,
} from "@/lib/server/auth/request-guard";

// Step 2: check the code, create the account (register tab only), set the session cookie.
export async function POST(request: Request) {
  try {
    const body = parseOtpVerifyBody(await readGuardedJson(request));
    if (!body) throw new AppError("invalid_input", 400);
    const { email, code, next, ...account } = body;
    await verifyCode({
      email,
      code,
      account,
      emailHash: emailKey(email),
      ipHash: clientIpKey(request),
      client: clientInfo(request),
    });
    return authJson({ ok: true, redirect: safeNextPath(next) ?? DEFAULT_AFTER_LOGIN }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
