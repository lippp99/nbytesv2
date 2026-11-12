import { parseSecondFactorBody } from "@/lib/admin-auth/admin-auth-contract";
import { verifySecondFactor } from "@/lib/server/admin-auth/login/second-factor";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { AppError } from "@/lib/server/errors";

// Admin step 3: TOTP or backup code on the login ticket -> admin session cookie (+ backup codes once, after enrollment).
export async function POST(request: Request) {
  try {
    const factor = parseSecondFactorBody(await readGuardedJson(request));
    if (!factor) throw new AppError("invalid_input", 400);
    const result = await verifySecondFactor(factor, clientIpKey(request), request.headers.get("user-agent"));
    return authJson({ ok: true, ...result }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
