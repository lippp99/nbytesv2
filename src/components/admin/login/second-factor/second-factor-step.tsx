"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCodeIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { ghostAction } from "@/components/app-kit/button";
import { verifySecondFactor } from "@/lib/admin-auth/admin-auth-client";
import { TOTP_LENGTH, isDigits, normalizeBackupCode } from "@/lib/admin-auth/admin-auth-contract";
import { CodeStep } from "../code-step";
import { LoginCard } from "../login-card";
import { loginCopy as copy, loginErrorMessage } from "../login-copy";
import { BackupCodes } from "./backup-codes";
import { BackupStep } from "./backup-step";
import { EnrollSetup } from "./enroll-setup";

type Mode = "totp" | "backup" | "enroll";
type Props = { enroll: boolean; onRestart: (message: string | null) => void };

/** Step 3 (PRD backend-auth-admin §4, §7): authenticator code, a backup code, or the first setup; then /admin. */
export function SecondFactorStep({ enroll, onRestart }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(enroll ? "enroll" : "totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // This step was just reached, or its mode changed: move focus to its heading.
  useEffect(() => headingRef.current?.focus(), [mode, backupCodes]);

  useEffect(() => {
    if (error && !pending) inputRef.current?.focus();
  }, [error, pending]);

  function switchMode(next: Mode) {
    setMode(next);
    setCode("");
    setError(null);
  }

  async function verify(value: string) {
    if (pending || success) return;
    const backup = mode === "backup";
    if (backup ? !normalizeBackupCode(value) : !isDigits(value, TOTP_LENGTH)) {
      return setError(backup ? copy.backup.incomplete : copy.totp.incomplete);
    }
    setError(null);
    setPending(true);
    const result = await verifySecondFactor(value);
    setPending(false);
    if (result.ok && result.backupCodes) return setBackupCodes(result.backupCodes);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin"), 800);
      return;
    }
    setCode("");
    if (result.error.kind === "expired") return onRestart(copy.restart);
    if (result.error.kind === "invalid") {
      return setError((backup ? copy.backup.invalid : copy.totp.invalid)(result.error.attemptsLeft));
    }
    setError(loginErrorMessage(result.error));
  }

  if (backupCodes) {
    return (
      <LoginCard step={3}>
        <BackupCodes codes={backupCodes} headingRef={headingRef} onDone={() => router.push("/admin")} />
      </LoginCard>
    );
  }

  const locked = pending || success;
  const restart = (
    <button type="button" onClick={() => onRestart(null)} disabled={locked} className={ghostAction("-ml-3", "sm")}>
      {copy.totp.back}
    </button>
  );
  const status = success && <p role="status" className="mt-2 text-app-small text-app-success">{copy.success}</p>;
  const switchLink = (next: Mode, label: string) => (
    <p className="mt-3 text-center">
      <button type="button" onClick={() => switchMode(next)} disabled={locked}
        className={ghostAction("text-app-accent-text", "sm")}>{label}</button>
    </p>
  );

  if (mode === "backup") {
    return (
      <LoginCard step={2} footerAction={restart}>
        <BackupStep code={code} error={error} locked={locked} pending={pending} headingRef={headingRef} inputRef={inputRef}
          onCodeChange={setCode} onVerify={verify} note={status} below={switchLink("totp", copy.backup.useTotp)} />
      </LoginCard>
    );
  }

  const setup = mode === "enroll";
  const text = setup ? copy.enroll : copy.totp;
  return (
    <LoginCard step={2} footerAction={restart}>
      <CodeStep icon={setup ? QrCodeIcon : SmartPhone01Icon} title={text.title} sub={text.sub} srLabel={copy.totp.srLabel}
        length={TOTP_LENGTH} code={code} error={error} locked={locked} submitLabel={pending ? copy.verifying : text.submit}
        headingRef={headingRef} inputRef={inputRef} onCodeChange={setCode} onVerify={verify} note={status}
        before={setup && <EnrollSetup onExpired={() => onRestart(copy.restart)} />}
        below={!setup && switchLink("backup", copy.useBackup)} />
    </LoginCard>
  );
}
