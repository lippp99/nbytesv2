"use client";

import { type Ref, useState } from "react";
import { Copy01Icon, Download04Icon, Key01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { formatBackupCode } from "@/lib/admin-auth/admin-auth-contract";
import { loginCopy } from "../login-copy";
import { StepHeading } from "../step-heading";

const copy = loginCopy.codes;

type BackupCodesProps = { codes: string[]; headingRef: Ref<HTMLHeadingElement>; onDone: () => void };

/** The 10 backup codes, shown once right after the first setup (PRD §6, A.3): copy or download, then continue. */
export function BackupCodes({ codes, headingRef, onDone }: BackupCodesProps) {
  const [copied, setCopied] = useState(false);
  const text = codes.map(formatBackupCode).join("\n");

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the codes stay on screen to copy by hand or download
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: copy.fileName });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <StepHeading icon={Key01Icon} title={copy.title} sub={copy.sub} headingRef={headingRef} />
      <ol aria-label={copy.listLabel}
        className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 rounded-app-code border border-app-border bg-app-inset px-5 py-4">
        {codes.map((code) => (
          <li key={code} className="text-center font-mono text-app-code text-app-text tabular-nums select-all">
            {formatBackupCode(code)}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={copyAll} className={secondaryAction(undefined, "sm")}>
          <HugeiconsIcon icon={Copy01Icon} aria-hidden />
          <span aria-live="polite">{copied ? copy.copied : copy.copy}</span>
        </button>
        <button type="button" onClick={download} className={secondaryAction(undefined, "sm")}>
          <HugeiconsIcon icon={Download04Icon} aria-hidden />
          {copy.download}
        </button>
      </div>
      <button type="button" onClick={onDone} className={primaryAction("mt-6 w-full")}>{copy.done}</button>
    </div>
  );
}
