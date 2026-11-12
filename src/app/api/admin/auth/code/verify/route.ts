import { parseAdminCodeBody } from "@/lib/admin-auth/admin-auth-contract";
import { verifyAdminCode } from "@/lib/server/admin-auth/login/verify-code";
import { authErrorResponse, authJson, clientIpKey, emailKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { AppError } from "@/lib/server/errors";

// Admin step 2: 10-digit email code -> login ticket cookie; says whether step 3 is TOTP or enrollment.
export async function POST(request: Request) {
  try {
    const body = parseAdminCodeBody(await readGuardedJson(request));
    if (!body) throw new AppError("invalid_input", 400);
    const { next } = await verifyAdminCode({
      email: body.email,
      code: body.code,
      emailHash: emailKey(body.email),
      ipHash: clientIpKey(request),
    });
    return authJson({ ok: true, next }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
