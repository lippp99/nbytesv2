import { AppError } from "@/lib/server/errors";
import { authErrorResponse, authJson, isSameOrigin } from "@/lib/server/auth/request-guard";
import { readSession } from "@/lib/server/auth/session";
import { revokeApiKey } from "@/lib/server/gateway/api-keys";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Dashboard: the signed-in user revokes one of their own keys (PRD gateway-api §5, §11). No body, so only the Origin
// part of the dashboard guard applies.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) throw new AppError("unavailable", 403);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const { id } = await params;
    if (!UUID.test(id)) throw new AppError("not_found", 404);
    await revokeApiKey(current.user.id, id);
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
