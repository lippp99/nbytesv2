import { AppError } from "@/lib/server/errors";
import { logAuthEvent } from "@/lib/server/auth/auth-events";
import { authErrorResponse, authJson, clientIpKey, emailKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession, revokeOtherSessions } from "@/lib/server/auth/session";

// Signs out every other device of the signed-in user; this one stays signed in.
export async function POST(request: Request) {
  try {
    await readGuardedJson(request); // Origin, JSON type and size checks; the body itself carries nothing
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const revoked = await revokeOtherSessions(current);
    if (revoked > 0) {
      const who = { emailHash: emailKey(current.user.email), ipHash: clientIpKey(request), userId: current.user.id };
      await logAuthEvent("sessions_revoked_others", who);
    }
    return authJson({ ok: true, revoked }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
