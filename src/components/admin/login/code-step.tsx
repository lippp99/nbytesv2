import type { FormEvent, ReactNode, Ref } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { primaryAction } from "@/components/app-kit/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sanitizeDigits } from "@/lib/admin-auth/admin-auth-contract";
import { StepHeading } from "./step-heading";

// Slots share the card width (10 slots fit 320px screens); filled slots go ink, the next one gets the accent ring.
// `!` because ui/ merges with the bare `cn` package.
const slot =
  "h-11 min-w-0 flex-1 rounded-app-inner! border border-app-border-strong bg-app-surface font-mono text-lg text-app-text " +
  "sm:h-14 sm:rounded-app-control! sm:text-2xl data-[active=true]:border-app-accent data-[active=true]:ring-3 " +
  "data-[active=true]:ring-app-accent/20 aria-invalid:border-app-danger";

type CodeStepProps = {
  icon: IconSvgElement;
  title: string;
  sub: ReactNode;
  srLabel: string;
  length: number;
  code: string;
  error: string | null;
  locked: boolean;
  submitLabel: string;
  before?: ReactNode;
  note?: ReactNode;
  below?: ReactNode;
  headingRef: Ref<HTMLHeadingElement>;
  inputRef: Ref<HTMLInputElement>;
  onCodeChange: (value: string) => void;
  onVerify: (value: string) => void;
};

function Slots({ start, count, filled, invalid }: { start: number; count: number; filled: number; invalid: boolean }) {
  return (
    <InputOTPGroup className="min-w-0 flex-1 gap-1 rounded-none sm:gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <InputOTPSlot key={i} index={start + i} aria-invalid={invalid || undefined}
          className={start + i < filled ? `${slot} border-app-text! bg-app-inset!` : slot} />
      ))}
    </InputOTPGroup>
  );
}

/** One code entry step (email code or authenticator code): digits split in two halves, auto-submit when full. */
export function CodeStep(props: CodeStepProps) {
  const { icon, title, sub, srLabel, length, code, error, locked, submitLabel, before, note, below } = props;
  const { headingRef, inputRef, onCodeChange, onVerify } = props;
  const half = length / 2;
  const clean = (value: string) => sanitizeDigits(value, length);

  function submit(event: FormEvent) {
    event.preventDefault();
    onVerify(code);
  }

  return (
    <form noValidate onSubmit={submit}>
      <StepHeading icon={icon} title={title} sub={sub} headingRef={headingRef} />
      {before}
      <div className="mt-6">
        <InputOTP ref={inputRef} maxLength={length} value={code} onChange={(v) => onCodeChange(clean(v))}
          onComplete={onVerify} pasteTransformer={clean} pattern="[0-9]*" inputMode="numeric"
          autoComplete="one-time-code" autoFocus disabled={locked} aria-label={srLabel}
          aria-invalid={error ? true : undefined} aria-describedby={error ? "code-error" : undefined} containerClassName="w-full">
          <Slots start={0} count={half} filled={code.length} invalid={!!error} />
          <span aria-hidden className="flex w-3 shrink-0 justify-center sm:w-4">
            <span className="h-px w-2 bg-app-text-3 sm:w-3" />
          </span>
          <Slots start={half} count={half} filled={code.length} invalid={!!error} />
        </InputOTP>
        {error && <p id="code-error" role="alert" className="mt-2 text-app-small text-app-danger">{error}</p>}
        {note}
      </div>
      <button type="submit" disabled={locked} aria-busy={locked || undefined} className={primaryAction("mt-6 w-full")}>
        {submitLabel}
      </button>
      {below}
    </form>
  );
}
