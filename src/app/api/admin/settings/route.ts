import { parseSettingsBody } from "@/lib/platform/platform-settings-contract";
import { AppError } from "@/lib/server/errors";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { savePlatformSettings } from "@/lib/server/platform/settings";

// Admin saves the platform settings: sign-up, maintenance and its banner, API key rate limit, admin session length.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const body = parseSettingsBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await savePlatformSettings(session.admin.id, body, clientIpKey(request));
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
