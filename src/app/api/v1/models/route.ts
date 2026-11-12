import { listPublicModels } from "@/lib/server/gateway/catalog";
import { authenticatePublic, gatewayErrorResponse, gatewayJson, newRequestId } from "@/lib/server/gateway/public-api";

// Curated catalog with nbytes sell prices, OpenAI list shape (PRD gateway-api §6). Read per request: it needs the key.
export async function GET(request: Request) {
  const requestId = newRequestId();
  try {
    await authenticatePublic(request);
    return gatewayJson({ object: "list", data: await listPublicModels() }, 200, requestId);
  } catch (error) {
    return gatewayErrorResponse(error, requestId);
  }
}
