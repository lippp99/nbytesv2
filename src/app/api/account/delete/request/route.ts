import { parseDeleteRequestBody } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { requestDeleteCode } from "@/lib/server/account/delete-account";
import { OTP_RESEND_SECONDS } from "@/lib/server/auth/otp/otp-rules";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession } from "@/lib/server/auth/session";

// Account deletion step 1: the user typed the phrase; email a code to the account's own address.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    if (!parseDeleteRequestBody(json)) throw new AppError("invalid_input", 400);
    await requestDeleteCode(current.user, clientIpKey(request));
    return authJson({ ok: true, resendAfter: OTP_RESEND_SECONDS }, 202);
  } catch (error) {
    return authErrorResponse(error);
  }
}
