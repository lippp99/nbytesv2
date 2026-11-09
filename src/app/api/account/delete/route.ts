import { parseDeleteAccountBody } from "@/lib/auth/auth-contract";
import { AppError } from "@/lib/server/errors";
import { deleteAccount } from "@/lib/server/account/delete-account";
import { authErrorResponse, authJson, clientIpKey, readGuardedJson } from "@/lib/server/auth/request-guard";
import { deleteCurrentSession, readSession } from "@/lib/server/auth/session";

// Account deletion step 2: check the code, delete the account, clear this browser's session cookie.
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const body = parseDeleteAccountBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    await deleteAccount(current.user, body.code, clientIpKey(request));
    await deleteCurrentSession(); // the row is already gone with the user; this clears the cookie
    return authJson({ ok: true }, 200);
  } catch (error) {
    return authErrorResponse(error);
  }
}
