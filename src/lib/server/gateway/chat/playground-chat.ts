import "server-only";
import { PLAYGROUND_MAX_BODY_BYTES, parsePlaygroundBody } from "@/lib/playground/playground-contract";
import { isSameOrigin } from "../../auth/request-guard";
import { hit } from "../../auth/rate-limit";
import { readSession } from "../../auth/session";
import { AppError, rateLimitedError } from "../../errors";
import { assertNotInMaintenance, readPublicJson } from "../public-api";
import { parseChatRequest, runChat } from "./chat-completions";

// POST /api/playground/chat (PRD dashboard-playground §5.1, gateway-api A5): the signed-in user, no API key, charged
// to their balance like any request. Same origin only; every step after the guard is the public chat flow.

const ENDPOINT = "/playground/chat";
const RATE_LIMIT = { count: 20, windowSeconds: 60 }; // P5, per user

export function playgroundChat(request: Request): Promise<Response> {
  return runChat(request, async () => {
    if (!isSameOrigin(request)) throw new AppError("forbidden", 403);
    const session = await readSession();
    if (!session) throw new AppError("unauthorized", 401);
    await assertNotInMaintenance();
    const userId = session.user.id;
    const wait = await hit(`gateway:playground:${userId}`, RATE_LIMIT.count, RATE_LIMIT.windowSeconds);
    if (wait) throw rateLimitedError(wait);
    const { json, bytes } = await readPublicJson(request, PLAYGROUND_MAX_BODY_BYTES);
    const body = parsePlaygroundBody(json);
    if (!body) throw new AppError("invalid_request", 400);
    return {
      caller: { userId, keyId: null, monthlyBudgetMicros: null, endpoint: ENDPOINT, finishOnDisconnect: true },
      chat: parseChatRequest({ ...body, stream: true }),
      bytes,
    };
  });
}
