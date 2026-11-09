import { parseRevokeBody } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { logAuthEvent } from "@/lib/server/auth/auth-events";
import { authErrorResponse, authJson, clientIpKey, emailKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession, revokeSession } from "@/lib/server/auth/session";

// Signs out one other device. Same 200 whether the id existed, so it never reveals other users' sessions.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const body = parseRevokeBody(json);
    // This device signs out from the sidebar, not from the list (PRD active-sessions S7).
    if (!body || body.sessionId === current.sessionId) throw new AppError("invalid_input", 400);
    if (await revokeSession(current, body.sessionId)) {
      const who = { emailHash: emailKey(current.user.email), ipHash: clientIpKey(request), userId: current.user.id };
      await logAuthEvent("session_revoked", who);
    }
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
