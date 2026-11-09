import { parseOtpRequestBody } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { OTP_RESEND_SECONDS } from "@/lib/server/auth/otp/otp-rules";
import { requestCode } from "@/lib/server/auth/otp/request-code";
import { authErrorResponse, authJson, clientIpKey, emailKey, readGuardedJson } from "@/lib/server/auth/request-guard";

// Step 1: send a code. Same 202 for every email (registered, new, suspended, sign-up closed).
export async function POST(request: Request) {
  try {
    const body = parseOtpRequestBody(await readGuardedJson(request));
    if (!body) throw new AppError("invalid_input", 400);
    await requestCode(body.email, emailKey(body.email), clientIpKey(request));
    return authJson({ ok: true, resendAfter: OTP_RESEND_SECONDS }, 202);
  } catch (error) {
    return authErrorResponse(error);
  }
}
