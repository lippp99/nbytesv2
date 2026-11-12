// Admin calls that change finance settings (exchange rate, deposit rules). Components use these, never raw fetch.
import { type AdminPostError, type AdminPostResult, postAdmin } from "../platform/admin-client";
import type { DepositRules } from "./deposit-contract";

export type RateError = AdminPostError;
export type RateResult = AdminPostResult;

export const saveExchangeRate = (idrPerUsd: number) => postAdmin("/api/admin/exchange-rate", { idrPerUsd });
export const saveDepositRules = (rules: DepositRules) => postAdmin("/api/admin/deposit-rules", rules);
