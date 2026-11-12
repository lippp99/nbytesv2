"use client";

import { useEffect, useRef, useState } from "react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { ghostAction } from "@/components/app-kit/button";
import { requestAdminCode, verifyAdminCode } from "@/lib/admin-auth/admin-auth-client";
import { ADMIN_OTP_LENGTH, isDigits } from "@/lib/admin-auth/admin-auth-contract";
import { isValidEmail, maskEmail, normalizeEmail } from "@/lib/auth/auth-contract";
import { CodeStep } from "./code-step";
import { EmailStep } from "./email-step";
import { LoginCard } from "./login-card";
import { formatCountdown, loginCopy as copy, loginErrorMessage } from "./login-copy";
import { SecondFactorStep } from "./second-factor/second-factor-step";

type Step = "email" | "code" | "totp" | "enroll";

/**
 * Admin sign-in (design B: card with stepper): email -> 10-digit email code -> authenticator (PRD backend-auth-admin
 * §4). Step 3 is either the TOTP or, on a first login, the authenticator setup; the server says which.
 */
export function AdminLoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepChanged = useRef(false);

  // Focus the new step's heading after a step change (not on first load, where the email field has autofocus).
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    headingRef.current?.focus();
  }, [step]);

  // After a wrong code the input unlocks again: put the cursor back in it.
  useEffect(() => {
    if (step === "code" && error && !pending) inputRef.current?.focus();
  }, [step, error, pending]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function goTo(next: Step, message: string | null = null) {
    stepChanged.current = true;
    setError(message);
    setCode("");
    setStep(next);
  }

  async function sendCode() {
    if (!isValidEmail(email)) return setError(copy.email.invalid);
    setError(null);
    setPending(true);
    const result = await requestAdminCode(email);
    setPending(false);
    if (!result.ok) return setError(loginErrorMessage(result.error));
    setResendIn(result.resendAfter);
    if (step === "email") goTo("code");
    else setCode("");
  }

  async function verify(value: string) {
    if (pending) return;
    if (!isDigits(value, ADMIN_OTP_LENGTH)) return setError(copy.code.incomplete);
    setError(null);
    setPending(true);
    const result = await verifyAdminCode(email, value);
    setPending(false);
    if (result.ok) return goTo(result.next);
    setCode("");
    if (result.error.kind === "expired") setResendIn(0);
    setError(loginErrorMessage(result.error));
  }

  if (step === "email") {
    return (
      <LoginCard step={0}>
        <EmailStep email={email} error={error} pending={pending} headingRef={headingRef}
          onEmailChange={setEmail} onSubmit={sendCode} />
      </LoginCard>
    );
  }

  if (step !== "code") return <SecondFactorStep enroll={step === "enroll"} onRestart={(message) => goTo("email", message)} />;

  const back = (
    <button type="button" onClick={() => goTo("email")} disabled={pending} className={ghostAction("-ml-3", "sm")}>
      {copy.code.back}
    </button>
  );
  return (
    <LoginCard step={1} footerAction={back}>
      <CodeStep icon={Mail01Icon} title={copy.code.title} srLabel={copy.code.srLabel} length={ADMIN_OTP_LENGTH}
        sub={<>{copy.code.sub} <strong className="font-medium text-app-text">{maskEmail(normalizeEmail(email))}</strong></>}
        code={code} error={error} locked={pending} submitLabel={pending ? copy.verifying : copy.code.submit}
        headingRef={headingRef} inputRef={inputRef} onCodeChange={setCode} onVerify={verify}
        below={
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1 text-app-small text-app-text-3">
            {copy.code.noCode}
            <button type="button" onClick={sendCode} disabled={resendIn > 0 || pending}
              className={ghostAction("px-1.5 text-app-accent-text disabled:text-app-text-3 disabled:opacity-100", "sm")}>
              {resendIn > 0 ? <>{copy.code.resendIn} <span className="font-mono tabular-nums">{formatCountdown(resendIn)}</span></> : copy.code.resend}
            </button>
          </p>
        }
      />
    </LoginCard>
  );
}
