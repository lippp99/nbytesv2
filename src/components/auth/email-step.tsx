import type { FormEvent, Ref } from "react";
import { primaryButton, textLink } from "@/components/button-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EMAIL_MAX_LENGTH } from "@/lib/auth/auth-contract";
import { authCopy } from "./auth-copy";
import { errorText, fieldFocus } from "./field-styles";

const copy = authCopy.email;

type EmailStepProps = {
  email: string;
  error: string | null;
  pending: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

/** One form for sign-in and sign-up: the server sends a code either way and creates the account on first login. */
export function EmailStep({ email, error, pending, headingRef, onEmailChange, onSubmit }: EmailStepProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-semibold tracking-tight text-balance outline-none">
        {copy.title}
      </h1>
      <p className="mt-2 text-center text-muted-foreground text-balance">{copy.sub}</p>
      <form noValidate onSubmit={submit} className="mt-7 text-base">
        <Label htmlFor="email" className="text-sm">{copy.label}</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={copy.placeholder}
          maxLength={EMAIL_MAX_LENGTH}
          autoFocus
          required
          value={email}
          disabled={pending}
          onChange={(e) => onEmailChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : "email-hint"}
          className={cn("mt-2 h-12 px-4 text-base", fieldFocus)}
        />
        {error ? (
          <p id="email-error" role="alert" className={errorText}>{error}</p>
        ) : (
          <p id="email-hint" className="mt-2 text-sm text-muted-foreground">{copy.hint}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className={primaryButton("mt-6 h-12 w-full rounded-full text-base")}
        >
          {pending ? copy.sending : copy.submit}
        </button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {copy.termsBefore} <a href="#" className={textLink}>{copy.terms}</a> {copy.and}{" "}
          <a href="#" className={textLink}>{copy.privacy}</a>.
        </p>
      </form>
    </div>
  );
}
