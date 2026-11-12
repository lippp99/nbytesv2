import type { UserAuthError } from "@/lib/auth/auth-client";

/** What went wrong on the code step; decides the slots, the message and what the main button does (design A). */
export type OtpIssue =
  | { kind: "incomplete" }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "expired" }
  | { kind: "locked"; minutes: number }
  | { kind: "offline" }
  | { kind: "check_failed" }
  | { kind: "send_failed"; error: UserAuthError };

/** Server/client error -> issue. `sending`: the error came from "resend", so a server fault means the email failed. */
export function otpIssueOf(error: UserAuthError, sending = false): OtpIssue {
  switch (error.kind) {
    case "invalid":
      return { kind: "invalid", attemptsLeft: error.attemptsLeft };
    case "expired":
      return { kind: "expired" };
    case "rate_limited":
      return { kind: "locked", minutes: error.retryAfterMinutes };
    case "offline":
      return { kind: "offline" };
    case "invalid_input":
      return { kind: "incomplete" };
    default:
      return sending ? { kind: "send_failed", error } : { kind: "check_failed" };
  }
}
