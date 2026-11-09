"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { ghostAction } from "@/components/app-kit/button";
import { DEMO_ADMIN_CODES, requestAdminCode, verifyAdminCode, verifyTotp } from "@/lib/admin-auth/admin-auth-client";
import { ADMIN_OTP_LENGTH, TOTP_LENGTH, isDigits } from "@/lib/admin-auth/admin-auth-contract";
import { isValidEmail, maskEmail, normalizeEmail } from "@/lib/auth/auth-contract";
import { CodeStep } from "./code-step";
import { EmailStep } from "./email-step";
import { LoginCard } from "./login-card";
import { formatCountdown, loginCopy as copy, loginErrorMessage } from "./login-copy";

type Step = "email" | "code" | "totp";
const demo = process.env.NODE_ENV === "development" ? DEMO_ADMIN_CODES : null;

/** Admin sign-in (design B: card with stepper): email -> 10-digit email code -> 6-digit TOTP (PRD admin-console §2.1). */
export function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
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
    if (step !== "email" && error && !pending) inputRef.current?.focus();
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
    if (pending || success) return;
    const totp = step === "totp";
    if (!isDigits(value, totp ? TOTP_LENGTH : ADMIN_OTP_LENGTH)) {
      return setError(totp ? copy.totp.incomplete : copy.code.incomplete);
    }
    setError(null);
    setPending(true);
    const result = await (totp ? verifyTotp(value) : verifyAdminCode(value));
    setPending(false);
    if (result.ok && !totp) return goTo("totp");
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin"), 800);
      return;
    }
    setCode("");
    if (totp && result.error.kind === "expired") return goTo("email", copy.restart);
    if (totp && result.error.kind === "invalid") return setError(copy.totp.invalid(result.error.attemptsLeft));
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

  const isTotp = step === "totp";
  const text = isTotp ? copy.totp : copy.code;
  const locked = pending || success;
  const demoCode = demo && (isTotp ? demo.totp : demo.email);
  const sub = isTotp ? copy.totp.sub : (
    <>{copy.code.sub} <strong className="font-medium text-app-text">{maskEmail(normalizeEmail(email))}</strong></>
  );
  const back = (
    <button type="button" onClick={() => goTo("email")} disabled={locked} className={ghostAction("-ml-3", "sm")}>
      {text.back}
    </button>
  );

  return (
    <LoginCard step={isTotp ? 2 : 1} footerAction={back}>
      <CodeStep key={step} icon={isTotp ? SmartPhone01Icon : Mail01Icon} title={text.title} sub={sub} srLabel={text.srLabel}
        length={isTotp ? TOTP_LENGTH : ADMIN_OTP_LENGTH} code={code} error={error} locked={locked}
        submitLabel={pending ? copy.verifying : text.submit} headingRef={headingRef} inputRef={inputRef}
        onCodeChange={setCode} onVerify={verify}
        note={
          <>
            {success && <p role="status" className="mt-2 text-app-small text-app-success">{copy.success}</p>}
            {demoCode && <p className="mt-2 font-mono text-app-code text-app-text-3">{copy.demo} {demoCode}</p>}
          </>
        }
        below={!isTotp && (
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1 text-app-small text-app-text-3">
            {copy.code.noCode}
            <button type="button" onClick={sendCode} disabled={resendIn > 0 || locked}
              className={ghostAction("px-1.5 text-app-accent-text disabled:text-app-text-3 disabled:opacity-100", "sm")}>
              {resendIn > 0 ? <>{copy.code.resendIn} <span className="font-mono tabular-nums">{formatCountdown(resendIn)}</span></> : copy.code.resend}
            </button>
          </p>
        )}
      />
    </LoginCard>
  );
}
