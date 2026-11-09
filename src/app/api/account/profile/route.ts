import { parseProfileBody } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { updateProfile } from "@/lib/server/account/profile";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession } from "@/lib/server/auth/session";

// Account Settings: the signed-in user saves their own name. Origin check, then session, then validation.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const body = parseProfileBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    const profile = await updateProfile(current.user, body, clientIpKey(request));
    return authJson({ ok: true, profile }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
