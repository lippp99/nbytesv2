import { parseUserStatusBody } from "@/lib/admin-users/user-admin-contract";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { changeUserStatus } from "@/lib/server/account/user-admin";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { AppError } from "@/lib/server/errors";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admin suspends or restores one user account (PRD admin-users-audit §3.3).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const { id } = await params;
    if (!UUID.test(id)) throw new AppError("not_found", 404);
    const body = parseUserStatusBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await changeUserStatus(session.admin.id, id, body, clientIpKey(request));
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
