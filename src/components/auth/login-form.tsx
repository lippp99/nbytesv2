"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/auth/auth-client";
import {
  type AuthAccount, type AuthMode, isValidEmail, isValidName, isValidOtp, maskEmail, normalizeEmail,
} from "@/lib/auth/auth-contract";
import { cn } from "@/lib/utils";
import { authCopy, authErrorMessage } from "./auth-copy";
import { type AuthField, EmailStep } from "./email-step";
import { OtpStep } from "./otp-step";

type Step = "email" | "otp";
const FADE_OUT_MS = 120;

type LoginFormProps = { nextPath?: string | null; initialMode?: AuthMode };

// `nextPath` is the raw ?next= value; the server checks it before using it as the redirect.
export function LoginForm({ nextPath = null, initialMode = "login" }: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fields, setFields] = useState<Record<AuthField, string>>({ firstName: "", lastName: "", email: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<AuthField>("email");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const stepChanged = useRef(false);

  // Move focus to the new step's heading after a step change, not on first load (email has autofocus).
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    headingRef.current?.focus();
  }, [step]);

  // After a failed code the input is enabled again (it was locked while verifying): back to slot 1.
  useEffect(() => {
    if (step === "otp" && error && !pending) otpRef.current?.focus();
  }, [step, error, pending]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function goTo(next: Step) {
    setVisible(false);
    setTimeout(() => {
      stepChanged.current = true;
      setError(null);
      setCode("");
      setStep(next);
      setVisible(true);
    }, FADE_OUT_MS);
  }

  const { email } = fields;
  const lastName = fields.lastName.trim() ? fields.lastName : null; // optional
  const account: AuthAccount = mode === "login" ? { mode } : { mode, firstName: fields.firstName, lastName };

  function fail(message: string, field: AuthField = "email") {
    setErrorField(field);
    setError(message);
  }

  function changeMode(next: AuthMode) {
    setError(null);
    setMode(next);
  }

  async function sendCode() {
    if (mode === "register" && !isValidName(fields.firstName)) return fail(authCopy.names.firstInvalid, "firstName");
    if (mode === "register" && fields.lastName.trim() && !isValidName(fields.lastName)) {
      return fail(authCopy.names.lastInvalid, "lastName");
    }
    if (!isValidEmail(email)) return fail(authCopy.email.invalid);
    setError(null);
    setPending(true);
    const result = await requestOtp(mode, email);
    setPending(false);
    if (!result.ok) return fail(result.error.kind === "invalid_input" ? authCopy.email.invalid : authErrorMessage(result.error));
    setResendIn(result.resendAfter);
    if (step === "email") return goTo("otp");
    setCode("");
    otpRef.current?.focus();
  }

  async function verify(value: string) {
    if (pending || success) return;
    if (!isValidOtp(value)) return setError(authCopy.otp.incomplete);
    setError(null);
    setPending(true);
    const result = await verifyOtp(account, email, value, nextPath);
    setPending(false);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.push(result.redirect), 1000);
      return;
    }
    fail(result.error.kind === "invalid_input" ? authCopy.otp.incomplete : authErrorMessage(result.error));
    if (result.error.kind === "expired") setResendIn(0);
    setCode("");
  }

  return (
    <div className={cn("transition-opacity ease-out", visible ? "opacity-100 duration-200" : "opacity-0 duration-120")}>
      {step === "email" ? (
        <EmailStep
          mode={mode}
          firstName={fields.firstName}
          lastName={fields.lastName}
          email={email}
          error={error}
          errorField={errorField}
          pending={pending}
          headingRef={headingRef}
          onModeChange={changeMode}
          onFieldChange={(field, value) => setFields((f) => ({ ...f, [field]: value }))}
          onSubmit={sendCode}
        />
      ) : (
        <OtpStep
          maskedEmail={maskEmail(normalizeEmail(email))}
          code={code}
          error={error}
          pending={pending}
          success={success}
          resendIn={resendIn}
          headingRef={headingRef}
          inputRef={otpRef}
          onCodeChange={setCode}
          onVerify={verify}
          onResend={sendCode}
          onChangeEmail={() => goTo("email")}
        />
      )}
    </div>
  );
}
