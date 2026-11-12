import { parseCreateKeyBody } from "@/lib/gateway/keys/api-key-contract";
import { AppError } from "@/lib/server/errors";
import { authErrorResponse, authJson, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession } from "@/lib/server/auth/session";
import { createApiKey } from "@/lib/server/gateway/api-keys";

// Dashboard: the signed-in user creates an API key; the full key is in this reply only (PRD gateway-api §5, §11).
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const body = parseCreateKeyBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    return authJson({ ok: true, key: await createApiKey(current.user.id, body) }, 201);
  } catch (error) {
    return authErrorResponse(error);
  }
}
