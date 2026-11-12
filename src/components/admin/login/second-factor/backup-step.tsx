import type { FormEvent, ReactNode, Ref } from "react";
import { Key01Icon } from "@hugeicons/core-free-icons";
import { primaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { loginCopy } from "../login-copy";
import { StepHeading } from "../step-heading";

const copy = loginCopy.backup;

type BackupStepProps = {
  code: string;
  error: string | null;
  locked: boolean;
  pending: boolean;
  note?: ReactNode;
  below?: ReactNode;
  headingRef: Ref<HTMLHeadingElement>;
  inputRef: Ref<HTMLInputElement>;
  onCodeChange: (value: string) => void;
  onVerify: (value: string) => void;
};

/** Step 3 with a one-time backup code ("ABCDE-FGHJK") instead of the authenticator. */
export function BackupStep(props: BackupStepProps) {
  const { code, error, locked, pending, note, below, headingRef, inputRef, onCodeChange, onVerify } = props;

  function submit(event: FormEvent) {
    event.preventDefault();
    onVerify(code);
  }

  return (
    <form noValidate onSubmit={submit}>
      <StepHeading icon={Key01Icon} title={copy.title} sub={copy.sub} headingRef={headingRef} />
      <div className="mt-6">
        <Field id="admin-backup" label={copy.label} error={error}>
          <TextInput ref={inputRef} id="admin-backup" name="backup-code" autoComplete="off" autoCapitalize="characters"
            spellCheck={false} autoFocus maxLength={11} placeholder={copy.placeholder} value={code} disabled={locked}
            aria-invalid={error ? true : undefined} aria-describedby={describedBy("admin-backup", { error })}
            onChange={(e) => onCodeChange(e.target.value)} className="h-11 font-mono uppercase" />
        </Field>
        {note}
      </div>
      <button type="submit" disabled={locked} aria-busy={locked || undefined} className={primaryAction("mt-6 w-full")}>
        {pending ? loginCopy.verifying : copy.submit}
      </button>
      {below}
    </form>
  );
}
