import { parseModelPriceBody } from "@/lib/gateway/catalog-contract";
import { AppError } from "@/lib/server/errors";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { saveModelPrice } from "@/lib/server/admin-gateway/catalog-admin";

// Admin adds, reprices or turns off one curated model (D4). 409 blocked: the Surplus list price is 0.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const body = parseModelPriceBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await saveModelPrice(session.admin.id, body, clientIpKey(request));
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
