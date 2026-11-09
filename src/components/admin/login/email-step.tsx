import type { FormEvent, Ref } from "react";
import { UserShield01Icon } from "@hugeicons/core-free-icons";
import { primaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { EMAIL_MAX_LENGTH } from "@/lib/auth/auth-contract";
import { loginCopy } from "./login-copy";
import { StepHeading } from "./step-heading";

const copy = loginCopy.email;

type EmailStepProps = {
  email: string;
  error: string | null;
  pending: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function EmailStep({ email, error, pending, headingRef, onEmailChange, onSubmit }: EmailStepProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form noValidate onSubmit={submit}>
      <StepHeading icon={UserShield01Icon} title={copy.title} sub={copy.sub} headingRef={headingRef} />
      <div className="mt-6">
        <Field id="admin-email" label={copy.label} hint={copy.hint} error={error}>
          <TextInput id="admin-email" type="email" name="email" autoComplete="email" inputMode="email" autoFocus required
            placeholder={copy.placeholder} maxLength={EMAIL_MAX_LENGTH} value={email} disabled={pending}
            aria-invalid={error ? true : undefined} aria-describedby={describedBy("admin-email", { hint: copy.hint, error })}
            onChange={(e) => onEmailChange(e.target.value)} className="h-11" />
        </Field>
      </div>
      <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction("mt-6 w-full")}>
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
