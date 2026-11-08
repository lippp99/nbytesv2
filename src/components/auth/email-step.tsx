import type { FormEvent, Ref } from "react";
import { primaryButton, textLink } from "@/components/button-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EMAIL_MAX_LENGTH } from "@/lib/auth-contract";
import { type AuthMode, authCopy } from "./auth-copy";
import { errorText, fieldFocus } from "./field-styles";

const copy = authCopy.email;
const modeOrder: AuthMode[] = ["login", "register"];

// Segmented tabs after jatevo.ai login: 12px plate, 8px active chip inside 4px padding.
// `!` because ui/ merges with the bare `cn` package, which keeps its own rounded-md/rounded-lg over our tokens.
const tabList = "h-12 w-full rounded-panel! bg-muted p-1 group-data-horizontal/tabs:h-12";
const tabTrigger =
  "h-full rounded-chip! text-base text-muted-foreground data-active:bg-background data-active:text-foreground " +
  "data-active:shadow-sm dark:data-active:border-transparent dark:data-active:bg-background";

type EmailStepProps = {
  mode: AuthMode;
  email: string;
  error: string | null;
  pending: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function EmailStep(props: EmailStepProps) {
  const { mode, headingRef, onModeChange } = props;
  const other = mode === "login" ? "register" : "login";

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-semibold tracking-tight text-balance outline-none">
        {copy.title}
      </h1>
      <p className="mt-2 text-center text-muted-foreground text-balance">{copy.sub}</p>
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as AuthMode)} className="mt-7 gap-6">
        <TabsList aria-label={copy.tabsLabel} className={tabList}>
          {modeOrder.map((m) => (
            <TabsTrigger key={m} value={m} className={tabTrigger}>{copy.modes[m].tab}</TabsTrigger>
          ))}
        </TabsList>
        {/* only the active panel is mounted, so the shared email field never has duplicate ids */}
        {modeOrder.map((m) => (
          <TabsContent key={m} value={m} className="text-base">
            <EmailForm {...props} />
          </TabsContent>
        ))}
      </Tabs>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {copy.modes[mode].switchPrompt}{" "}
        <button type="button" onClick={() => onModeChange(other)} className={cn(textLink, "font-medium text-accent-ink")}>
          {copy.modes[mode].switchAction}
        </button>
      </p>
    </div>
  );
}

function EmailForm({ mode, email, error, pending, onEmailChange, onSubmit }: EmailStepProps) {
  const text = copy.modes[mode];

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form noValidate onSubmit={submit}>
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
        <p id="email-hint" className="mt-2 text-sm text-muted-foreground">{text.hint}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={primaryButton("mt-6 h-12 w-full rounded-full text-base")}
      >
        {pending ? copy.sending : text.submit}
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {copy.termsBefore} <a href="#" className={textLink}>{copy.terms}</a> {copy.and}{" "}
        <a href="#" className={textLink}>{copy.privacy}</a>.
      </p>
    </form>
  );
}
