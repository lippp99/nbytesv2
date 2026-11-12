"use client";

import { useState } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ghostAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { CodeBlock } from "@/components/app-kit/code-block";
import { apiKeysCopy as copy } from "./api-keys-copy";

/**
 * The full key, shown once after creation. It lives only in this component's props: closing the card or leaving the
 * page drops it. Closing before any copy asks first, since the key cannot be shown again (PRD dashboard-api-keys R3).
 */
export function NewKeyNotice({ secret, onDone }: { secret: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const markCopied = () => setCopied(true);

  return (
    <Card>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-3">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden className="mt-0.5 size-5 shrink-0 text-app-warning" />
          <div>
            <h2 className="text-app-card text-app-text">{copy.newKeyTitle}</h2>
            <p className="mt-1 text-app-ui text-app-text-2">{copy.newKeyBody}</p>
          </div>
        </div>
        <CodeBlock title={copy.keyBlock} code={secret} wrap onCopy={markCopied} />
        <CodeBlock title={copy.envBlock} code={`export NBYTES_API_KEY=${secret}`} wrap onCopy={markCopied} />
        {asking ? (
          <div role="alert" className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-app-ui text-app-text-2">{copy.notCopied}</span>
            <button type="button" onClick={() => setAsking(false)} className={ghostAction("", "sm")}>{copy.back}</button>
            <button type="button" onClick={onDone} className={secondaryAction("", "sm")}>{copy.closeAnyway}</button>
          </div>
        ) : (
          <button type="button" onClick={() => (copied ? onDone() : setAsking(true))} className={secondaryAction("self-end")}>
            {copy.done}
          </button>
        )}
      </div>
    </Card>
  );
}
