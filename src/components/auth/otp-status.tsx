import {
  AlertCircleIcon, CheckmarkCircle02Icon, Clock01Icon, SquareLock02Icon, WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { OTP_MAX_ATTEMPTS } from "@/lib/auth/auth-contract";
import { cn } from "@/lib/utils";
import { authCopy, authErrorMessage } from "./auth-copy";
import type { OtpIssue } from "./otp-issue";

const copy = authCopy.otp;

type Line = { icon: IconSvgElement; text: string; tone: string };

function lineOf(issue: OtpIssue): Line {
  const bad = "text-destructive";
  switch (issue.kind) {
    case "incomplete":
      return { icon: AlertCircleIcon, text: copy.incomplete, tone: bad };
    case "invalid":
      return { icon: AlertCircleIcon, text: copy.invalid(issue.attemptsLeft), tone: bad };
    case "expired":
      return { icon: Clock01Icon, text: copy.expired, tone: bad };
    case "locked":
      return { icon: SquareLock02Icon, text: copy.locked(issue.minutes), tone: "text-warn" };
    case "offline":
      return { icon: WifiDisconnected01Icon, text: copy.offline, tone: bad };
    case "check_failed":
      return { icon: AlertCircleIcon, text: copy.checkFailed, tone: bad };
    case "send_failed":
      return { icon: AlertCircleIcon, text: authErrorMessage(issue.error), tone: bad };
  }
}

/** Five bars, the used ones in the error tone; the words next to it carry the same number. */
function Tries({ left }: { left: number }) {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 gap-1 self-center">
      {Array.from({ length: OTP_MAX_ATTEMPTS }, (_, i) => (
        <span key={i} className={cn("h-1 w-3.5 rounded-full", i < OTP_MAX_ATTEMPTS - left ? "bg-destructive" : "bg-guide")} />
      ))}
    </span>
  );
}

const row = "mt-3 flex items-start gap-2 text-sm";

/** The one line under the slots: success (status) or the issue (alert), always icon + words, never color alone. */
export function OtpStatus({ issue, success }: { issue: OtpIssue | null; success: boolean }) {
  if (success) {
    return (
      <p role="status" className={cn(row, "text-success")}>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="mt-px size-4.5 shrink-0" />
        <span><span className="font-semibold">{copy.success}</span> <span className="text-muted-foreground">{copy.opening}</span></span>
      </p>
    );
  }
  if (!issue) return null;
  const line = lineOf(issue);
  return (
    <p id="otp-error" role="alert" className={cn(row, line.tone)}>
      <HugeiconsIcon icon={line.icon} aria-hidden className="mt-px size-4.5 shrink-0" />
      <span>{line.text}</span>
      {issue.kind === "invalid" && <Tries left={issue.attemptsLeft} />}
    </p>
  );
}
