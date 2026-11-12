import { parseContactBody } from "@/lib/support/contact-contract";
import { AppError } from "@/lib/server/errors";
import { readAdminSession } from "@/lib/server/admin-auth/admin-session";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { saveContacts } from "@/lib/server/support/contacts";

// Admin sets the contact shown on the user's Contact page: WhatsApp, Telegram, email, each with a show switch.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const session = await readAdminSession();
    if (!session) throw new AppError("unauthorized", 401);
    const body = parseContactBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await saveContacts(session.admin.id, body, clientIpKey(request));
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
