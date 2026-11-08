"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_CODE_HINT, requestOtp, verifyOtp } from "@/lib/auth-client";
import { isValidEmail, isValidOtp, maskEmail, normalizeEmail } from "@/lib/auth-contract";
import { cn } from "@/lib/utils";
import { type AuthMode, authCopy, authErrorMessage } from "./auth-copy";
import { EmailStep } from "./email-step";
import { OtpStep } from "./otp-step";

type Step = "email" | "otp";
const FADE_OUT_MS = 120;
const demoCode = process.env.NODE_ENV === "development" ? DEMO_CODE_HINT : null;

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<AuthMode>("login");
  const [visible, setVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  async function sendCode() {
    if (!isValidEmail(email)) return setError(authCopy.email.invalid);
    setError(null);
    setPending(true);
    const result = await requestOtp(email);
    setPending(false);
    if (!result.ok) return setError(authErrorMessage(result.error));
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
    const result = await verifyOtp(email, value);
    setPending(false);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 1000);
      return;
    }
    setError(authErrorMessage(result.error));
    if (result.error.kind === "expired") setResendIn(0);
    setCode("");
  }

  return (
    <div className={cn("transition-opacity ease-out", visible ? "opacity-100 duration-200" : "opacity-0 duration-120")}>
      {step === "email" ? (
        <EmailStep
          mode={mode}
          email={email}
          error={error}
          pending={pending}
          headingRef={headingRef}
          onModeChange={(next) => {
            setMode(next);
            setError(null);
          }}
          onEmailChange={setEmail}
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
          demoCode={demoCode}
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
