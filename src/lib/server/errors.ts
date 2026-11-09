import "server-only";
import type { AuthErrorCode } from "@/lib/auth/auth-contract";

export type AppErrorDetails = { retryAfterMinutes?: number; attemptsLeft?: number };

/** The one server error type: route handlers turn it into the JSON error contract; anything else becomes 503. */
export class AppError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    readonly details: AppErrorDetails = {},
    readonly retryAfterSeconds?: number,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "AppError";
  }
}

export function rateLimitedError(retryAfterSeconds: number): AppError {
  const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
  return new AppError("rate_limited", 429, { retryAfterMinutes: Math.ceil(seconds / 60) }, seconds);
}
