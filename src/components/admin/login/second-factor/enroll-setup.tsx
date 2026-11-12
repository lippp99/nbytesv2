"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { secondaryAction } from "@/components/app-kit/button";
import { startTotpEnrollment } from "@/lib/admin-auth/admin-auth-client";
import { loginCopy } from "../login-copy";

const copy = loginCopy.enroll;
type Setup = { secret: string; otpauthUrl: string };

/** "ABCDEFGH..." -> "ABCD EFGH ..." so the key can be typed into an app by hand. */
const groupKey = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

/**
 * QR, manual key and otpauth link for a first authenticator setup (PRD §7). Asks the server once per mount (a ref,
 * not state, so React's dev double-run does not ask twice and leave the page showing a replaced secret).
 */
export function EnrollSetup({ onExpired }: { onExpired: () => void }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [failed, setFailed] = useState(false);
  const asked = useRef(false);

  async function load() {
    setFailed(false);
    const result = await startTotpEnrollment();
    if (result.ok) return setSetup({ secret: result.secret, otpauthUrl: result.otpauthUrl });
    if (result.error.kind === "expired") return onExpired();
    setFailed(true);
  }

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    void load();
  });

  if (failed) {
    return (
      <div role="alert" className="mt-6 flex flex-col items-center gap-3 text-app-small text-app-danger">
        {copy.failed}
        <button type="button" onClick={load} className={secondaryAction(undefined, "sm")}>{copy.retry}</button>
      </div>
    );
  }
  if (!setup) {
    return (
      <div aria-busy className="mx-auto mt-6 size-44 animate-pulse rounded-app-code bg-app-inset motion-reduce:animate-none">
        <span className="sr-only">{copy.loading}</span>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {/* White tile in both themes: scanners need dark modules on a light ground. */}
      <QRCodeSVG value={setup.otpauthUrl} size={176} marginSize={4} level="M" title={copy.qrTitle}
        className="rounded-app-code border border-app-border" />
      <div className="w-full rounded-app-code border border-app-border bg-app-inset px-4 py-3 text-center">
        <p className="text-app-small text-app-text-2">{copy.secretLabel}</p>
        <p className="mt-1 font-mono text-app-code break-all text-app-text select-all">{groupKey(setup.secret)}</p>
      </div>
      <a href={setup.otpauthUrl} className="text-app-small text-app-accent-text underline-offset-4 hover:underline">{copy.openApp}</a>
    </div>
  );
}
