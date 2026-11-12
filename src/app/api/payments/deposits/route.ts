import { parseDepositBody } from "@/lib/payments/deposit-contract";
import { AppError } from "@/lib/server/errors";
import { authErrorResponse, authJson, readGuardedJson } from "@/lib/server/auth/request-guard";
import { readSession } from "@/lib/server/auth/session";
import { createDeposit } from "@/lib/server/payments/create-deposit";

// Billing: the signed-in user starts a deposit and gets the Sumopod payment link (PRD gateway-api §11).
export async function POST(request: Request) {
  try {
    const json = await readGuardedJson(request);
    const current = await readSession();
    if (!current) throw new AppError("unauthorized", 401);
    const body = parseDepositBody(json);
    if (!body) throw new AppError("invalid_input", 400);
    const deposit = await createDeposit(current.user.id, body.amountIdr);
    return authJson({ ok: true, deposit }, 201);
  } catch (error) {
    return authErrorResponse(error);
  }
}
