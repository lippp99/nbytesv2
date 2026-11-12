import type { FormEvent, Ref } from "react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { primaryButton, textLink } from "@/components/button-styles";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { OTP_LENGTH, sanitizeOtp } from "@/lib/auth/auth-contract";
import { formatCountdown } from "@/lib/date-format";
import { authCopy } from "./auth-copy";
import type { OtpIssue } from "./otp-issue";
import { OtpStatus } from "./otp-status";

const copy = authCopy.otp;

type OtpStepProps = {
  maskedEmail: string;
  code: string;
  issue: OtpIssue | null;
  pending: boolean;
  /** Where the browser goes after a correct code; set = signed in. */
  redirect: string | null;
  resendIn: number;
  /** Seconds left of a rate-limit lock; the main button counts down. */
  lockedFor: number;
  headingRef: Ref<HTMLHeadingElement>;
  inputRef: Ref<HTMLInputElement>;
  onCodeChange: (value: string) => void;
  onVerify: (value: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

type Tone = "plain" | "bad" | "ok" | "dim";

// Slots share the card width evenly (about 41px each in the 400px card); 48px tall, 56px from 640px.
const slotClass =
  "h-12 min-w-0 flex-1 rounded-chip! border border-input font-mono text-xl transition-colors duration-150 " +
  "sm:h-14 sm:text-2xl " +
  "data-[active=true]:border-foreground data-[active=true]:ring-2 data-[active=true]:ring-accent-mark dark:bg-transparent";
// `!`: ui/input-otp merges with the bare `cn`, and its aria-invalid border would win otherwise.
const toneClass: Record<Tone, string> = {
  plain: "",
  bad: "border-destructive!",
  ok: "border-success! bg-success/5! text-foreground",
  dim: "border-border! bg-muted! text-muted-foreground",
};

const resendClass =
  "mt-4 inline-flex min-h-11 items-center text-sm disabled:cursor-not-allowed disabled:no-underline disabled:text-muted-foreground";
const mainButton = "mt-6 h-12 w-full rounded-full text-base";

function Slots({ start, tone, invalid }: { start: number; tone: Tone; invalid: boolean }) {
  return (
    <InputOTPGroup className="min-w-0 flex-1 gap-1 rounded-none sm:gap-2">
      {Array.from({ length: OTP_LENGTH / 2 }, (_, i) => (
        <InputOTPSlot key={i} index={start + i} aria-invalid={invalid || undefined} className={cn(slotClass, toneClass[tone])} />
      ))}
    </InputOTPGroup>
  );
}

function toneOf(issue: OtpIssue | null, pending: boolean, signedIn: boolean): Tone {
  if (signedIn) return "ok";
  if (pending || issue?.kind === "expired" || issue?.kind === "locked") return "dim";
  return issue?.kind === "invalid" || issue?.kind === "incomplete" ? "bad" : "plain";
}

/** The main button always names the next step: verify, open the dashboard, ask a new code, or wait out the lock. */
function MainAction(props: OtpStepProps) {
  const { issue, pending, redirect, lockedFor } = props;
  if (redirect) {
    return (
      <a href={redirect} className={primaryButton(cn(mainButton, "relative overflow-hidden"))}>
        {copy.openNow}
        {/* fills over the 1s before the redirect; @starting-style, so no script */}
        <span aria-hidden className="absolute bottom-0 left-0 h-0.75 w-full bg-accent-mark transition-[width] duration-1000
          ease-linear starting:w-0 motion-reduce:transition-none" />
      </a>
    );
  }
  if (issue?.kind === "expired") {
    return (
      <button type="button" onClick={props.onResend} disabled={pending} aria-busy={pending || undefined}
        className={primaryButton(mainButton)}>
        <HugeiconsIcon icon={RefreshIcon} aria-hidden className="size-4" />
        {pending ? authCopy.email.sending : copy.newCode}
      </button>
    );
  }
  if (lockedFor > 0) {
    return (
      <button type="button" disabled className={primaryButton(mainButton)}>
        {copy.retryIn} <span className="font-mono tabular-nums">{formatCountdown(lockedFor)}</span>
      </button>
    );
  }
  const retry = issue?.kind === "offline" || issue?.kind === "check_failed";
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryButton(mainButton)}>
      {pending ? copy.verifying : retry ? copy.retry : copy.submit}
    </button>
  );
}

/** Under the main button: resend with its countdown, or what replaces it while the code cannot be used. */
function SecondaryAction(props: OtpStepProps) {
  const { issue, pending, redirect, resendIn, lockedFor } = props;
  if (redirect) return null;
  if (issue?.kind === "expired") return <p className="mt-4 text-center text-sm text-muted-foreground">{copy.lockedNote}</p>;
  if (lockedFor > 0) {
    return (
      <button type="button" onClick={props.onChangeEmail} className={cn(textLink, resendClass, "mx-auto flex w-fit")}>
        {copy.otherEmail}
      </button>
    );
  }
  return (
    <button type="button" onClick={props.onResend} disabled={resendIn > 0 || pending}
      className={cn(textLink, resendClass, "mx-auto flex w-fit")}>
      {resendIn > 0 ? `${copy.resendIn} ${formatCountdown(resendIn)}` : copy.resend}
    </button>
  );
}

export function OtpStep(props: OtpStepProps) {
  const { maskedEmail, code, issue, pending, redirect, lockedFor, headingRef, inputRef } = props;
  const locked = pending || !!redirect || issue?.kind === "expired" || lockedFor > 0;
  const tone = toneOf(issue, pending, !!redirect);
  const invalid = tone === "bad";

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onVerify(code);
  }

  return (
    <form noValidate onSubmit={submit}>
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-semibold tracking-tight outline-none">{copy.title}</h1>
      <p className="mt-2 text-center text-muted-foreground">
        {copy.subBefore} <strong className="font-medium text-foreground">{maskedEmail}</strong>.{" "}
        {!redirect && (
          <button type="button" onClick={props.onChangeEmail} className={cn(textLink, "text-foreground")}>
            {copy.changeEmail}
          </button>
        )}
      </p>
      <div className="mt-7">
        <InputOTP
          ref={inputRef}
          maxLength={OTP_LENGTH}
          value={code}
          onChange={(value) => props.onCodeChange(sanitizeOtp(value))}
          onComplete={props.onVerify}
          pasteTransformer={sanitizeOtp}
          pattern="[0-9]*"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          disabled={locked}
          aria-label={copy.srLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={issue ? "otp-error" : undefined}
          // the slot tones show the state; the primitive's 50% fade would wash out the success green
          containerClassName="w-full has-disabled:opacity-100!"
        >
          <Slots start={0} tone={tone} invalid={invalid} />
          <span aria-hidden className="flex w-3 shrink-0 justify-center sm:w-5">
            <span className="h-px w-1.5 bg-muted-foreground sm:w-2.5" />
          </span>
          <Slots start={OTP_LENGTH / 2} tone={tone} invalid={invalid} />
        </InputOTP>
        <OtpStatus issue={issue} success={!!redirect} />
      </div>
      <MainAction {...props} />
      <SecondaryAction {...props} />
    </form>
  );
}
