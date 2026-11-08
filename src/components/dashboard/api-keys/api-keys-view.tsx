"use client";

import { useState } from "react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/copy-button";
import { CreateKeyForm } from "./create-key-form";
import { apiKeysCopy as copy } from "./api-keys-copy";
import { common } from "@/components/dashboard/shared/common-copy";
import { apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { KeysTable } from "./keys-table";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Panel } from "@/components/dashboard/shared/panel";
import { primaryAction, secondaryAction } from "@/components/dashboard/shared/dashboard-buttons";

/** Shown once after creation: the full key with a copy button. */
function NewKeyNotice({ secret, onDone }: { secret: string; onDone: () => void }) {
  return (
    <Panel className="mt-8 border-accent-mark p-4 sm:p-5">
      <h2 className="font-medium">{copy.newKeyTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.newKeyBody}</p>
      <div className="mt-4 flex items-center gap-2 rounded-chip bg-muted pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-code">{secret}</code>
        <CopyButton text={secret} label={common.copy} copiedLabel={common.copied} />
      </div>
      <button type="button" onClick={onDone} className={secondaryAction("mt-4 rounded-full")}>{copy.done}</button>
    </Panel>
  );
}

export function ApiKeysView() {
  const [keys, setKeys] = useState(apiKeys);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const createButton = (
    <button type="button" onClick={() => setCreating(true)} disabled={creating} className={primaryAction("rounded-full")}>
      <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
      {copy.create}
    </button>
  );

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={createButton} />
      {creating && (
        <Panel title={copy.create} className="mt-8">
          <CreateKeyForm
            onCancel={() => setCreating(false)}
            onCreate={(key, newSecret) => {
              setKeys((k) => [key, ...k]);
              setSecret(newSecret);
              setCreating(false);
            }}
          />
        </Panel>
      )}
      {secret && <NewKeyNotice secret={secret} onDone={() => setSecret(null)} />}
      <Panel className="mt-8">
        <KeysTable keys={keys} onRevoke={(id) => setKeys((all) => all.filter((k) => k.id !== id))} />
      </Panel>
    </>
  );
}
