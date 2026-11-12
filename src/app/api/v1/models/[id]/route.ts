import { AppError } from "@/lib/server/errors";
import { publicModel } from "@/lib/server/gateway/catalog";
import { authenticatePublic, gatewayErrorResponse, gatewayJson, newRequestId } from "@/lib/server/gateway/public-api";

// One curated model (PRD gateway-api §6); an id outside the active catalog, aliases included, is 404.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  try {
    await authenticatePublic(request);
    const model = await publicModel((await params).id);
    if (!model) throw new AppError("model_not_found", 404, { param: "model" });
    return gatewayJson(model, 200, requestId);
  } catch (error) {
    return gatewayErrorResponse(error, requestId);
  }
}
