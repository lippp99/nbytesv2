import { startEnrollment } from "@/lib/server/admin-auth/login/enrollment";
import { authErrorResponse, authJson, readGuardedJson } from "@/lib/server/auth/request-guard";

// Admin step 3, first login: a new TOTP secret on the login ticket (PRD backend-auth-admin §7). Body: {}.
export async function POST(request: Request) {
  try {
    await readGuardedJson(request);
    return authJson({ ok: true, ...(await startEnrollment()) }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
