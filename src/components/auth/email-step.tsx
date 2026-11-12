import { type FormEvent, type Ref, useState } from "react";
import { primaryButton, textLink } from "@/components/button-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type AuthMode, EMAIL_MAX_LENGTH } from "@/lib/auth/auth-contract";
import { authCopy } from "./auth-copy";
import { FieldError } from "./field-error";
import { fieldFocus } from "./field-styles";
import { type NameField, NameFields } from "./name-fields";

const copy = authCopy.email;
const MODES = ["login", "register"] as const;
export type AuthField = NameField | "email";

type EmailStepProps = {
  mode: AuthMode;
  firstName: string;
  lastName: string;
  email: string;
  error: string | null;
  errorField: AuthField;
  pending: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onModeChange: (mode: AuthMode) => void;
  onFieldChange: (field: AuthField, value: string) => void;
  onSubmit: () => void;
};

// Pill tabs over the ui/tabs primitive (bare `cn`, so overrides need `!`).
// Dark track is --secondary (0.24): --muted (0.2) vanishes on the dark card (0.19).
const listClass = "h-12! w-full rounded-full! bg-muted p-1 dark:bg-secondary";
const triggerClass = "rounded-full! text-base disabled:opacity-100";

/** Login and register tabs; both send an 8-digit code to the email, register also asks for the names. */
export function EmailStep(props: EmailStepProps) {
  const { mode, email, error, errorField, pending, headingRef } = props;
  const emailError = errorField === "email" ? error : null;
  const nameError = errorField !== "email" && error ? { field: errorField, message: error } : null;
  // Autofocus only on first load: after a tab switch it would pull focus off the tab and open the phone keyboard.
  const [switched, setSwitched] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit();
  }

  const body = (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-semibold tracking-tight text-balance outline-none">
        {authCopy.title[mode]}
      </h1>
      <p className="mt-2 text-center text-muted-foreground text-balance">{authCopy.sub[mode]}</p>
      <form noValidate onSubmit={submit} className="mt-7 text-base">
        {mode === "register" && (
          <div className="mb-5">
            <NameFields
              firstName={props.firstName}
              lastName={props.lastName}
              disabled={pending}
              autoFocus={!switched}
              error={nameError}
              onChange={props.onFieldChange}
            />
          </div>
        )}
        <Label htmlFor="email" className="text-sm">{copy.label}</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={copy.placeholder}
          maxLength={EMAIL_MAX_LENGTH}
          autoFocus={mode === "login" && !switched}
          required
          value={email}
          disabled={pending}
          onChange={(e) => props.onFieldChange("email", e.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : "email-hint"}
          className={cn("mt-2 h-12 px-4 text-base", fieldFocus)}
        />
        {emailError ? (
          <FieldError id="email-error">{emailError}</FieldError>
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
    </>
  );

  return (
    <Tabs
      value={mode}
      onValueChange={(value: AuthMode) => {
        setSwitched(true);
        props.onModeChange(value);
      }}
      className="gap-7"
    >
      <TabsList className={listClass}>
        {MODES.map((m) => (
          <TabsTrigger key={m} value={m} disabled={pending} className={triggerClass}>{authCopy.tabs[m]}</TabsTrigger>
        ))}
      </TabsList>
      {MODES.map((m) => (
        <TabsContent key={m} value={m} className="text-base">{body}</TabsContent>
      ))}
    </Tabs>
  );
}
