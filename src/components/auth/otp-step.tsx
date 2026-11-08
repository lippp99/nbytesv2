import type { FormEvent, Ref } from "react";
import { primaryButton, textLink } from "@/components/button-styles";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { OTP_LENGTH, sanitizeOtp } from "@/lib/auth-contract";
import { authCopy, formatCountdown } from "./auth-copy";
import { errorText } from "./field-styles";

const copy = authCopy.otp;

type OtpStepProps = {
  maskedEmail: string;
  code: string;
  error: string | null;
  pending: boolean;
  success: boolean;
  resendIn: number;
  demoCode: string | null;
  headingRef: Ref<HTMLHeadingElement>;
  inputRef: Ref<HTMLInputElement>;
  onCodeChange: (value: string) => void;
  onVerify: (value: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

// Slots share the card width evenly (about 41px each in the 400px card); 48px tall, 56px from 640px.
const slotClass =
  "h-12 min-w-0 flex-1 rounded-chip! border border-input font-mono text-xl " +
  "sm:h-14 sm:text-2xl " +
  "data-[active=true]:border-foreground data-[active=true]:ring-2 data-[active=true]:ring-accent-mark dark:bg-transparent";

const resendClass =
  "mt-4 inline-flex min-h-11 items-center text-sm disabled:cursor-not-allowed disabled:no-underline disabled:text-muted-foreground";

function Slots({ start, invalid }: { start: number; invalid: boolean }) {
  return (
    <InputOTPGroup className="min-w-0 flex-1 gap-1 rounded-none sm:gap-2">
      {Array.from({ length: OTP_LENGTH / 2 }, (_, i) => (
        <InputOTPSlot key={i} index={start + i} aria-invalid={invalid || undefined} className={slotClass} />
      ))}
    </InputOTPGroup>
  );
}

export function OtpStep(props: OtpStepProps) {
  const { maskedEmail, code, error, pending, success, resendIn, demoCode, headingRef, inputRef } = props;
  const locked = pending || success;

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onVerify(code);
  }

  return (
    <form noValidate onSubmit={submit}>
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-semibold tracking-tight outline-none">{copy.title}</h1>
      <p className="mt-2 text-center text-muted-foreground">
        {copy.subBefore} <strong className="font-medium text-foreground">{maskedEmail}</strong>.{" "}
        <button type="button" onClick={props.onChangeEmail} className={cn(textLink, "text-foreground")}>
          {copy.changeEmail}
        </button>
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "otp-error" : undefined}
          containerClassName="w-full"
        >
          <Slots start={0} invalid={!!error} />
          <span aria-hidden className="flex w-3 shrink-0 justify-center sm:w-5">
            <span className="h-px w-1.5 bg-muted-foreground sm:w-2.5" />
          </span>
          <Slots start={OTP_LENGTH / 2} invalid={!!error} />
        </InputOTP>
        {error && <p id="otp-error" role="alert" className={errorText}>{error}</p>}
        {success && <p role="status" className="mt-2 text-sm text-success">{copy.success}</p>}
        {demoCode && <p className="mt-2 font-mono text-code text-muted-foreground">{copy.demo} {demoCode}</p>}
      </div>
      <button type="submit" disabled={locked} aria-busy={pending || undefined} className={primaryButton("mt-6 h-12 w-full rounded-full text-base")}>
        {pending ? copy.verifying : copy.submit}
      </button>
      <button
        type="button"
        onClick={props.onResend}
        disabled={resendIn > 0 || locked}
        className={cn(textLink, resendClass, "mx-auto flex w-fit")}
      >
        {resendIn > 0 ? `${copy.resendIn} ${formatCountdown(resendIn)}` : copy.resend}
      </button>
    </form>
  );
}
