"use client";

import { useState } from "react";
import { Alert02Icon, Key01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { CodeBlock } from "@/components/app-kit/code-block";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { apiKeysCopy as copy } from "./api-keys-copy";
import { CreateKeyForm } from "./create-key-form";
import { KeysTable } from "./keys-table";

/** Shown once after creation: the full key, a warning that it will not be shown again, and a way to dismiss it. */
function NewKeyNotice({ secret, onDone }: { secret: string; onDone: () => void }) {
  return (
    <Card className="border-app-accent/50">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-3">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden className="mt-0.5 size-5 shrink-0 text-app-accent-text" />
          <div>
            <h2 className="text-app-card text-app-text">{copy.newKeyTitle}</h2>
            <p className="mt-1 text-app-ui text-app-text-2">{copy.newKeyBody}</p>
          </div>
        </div>
        <CodeBlock title="NBYTES_API_KEY" code={secret} wrap />
        <button type="button" onClick={onDone} className={secondaryAction("self-end")}>{copy.done}</button>
      </div>
    </Card>
  );
}

export function ApiKeysView() {
  const [keys, setKeys] = useState(apiKeys);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const createButton = (
    <button type="button" onClick={() => setCreating(true)} disabled={creating} className={primaryAction()}>
      <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
      {copy.create}
    </button>
  );

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={createButton} />
      <div className="space-y-6">
        {creating && (
          <Card title={copy.createTitle} description={copy.createSub}>
            <CreateKeyForm onCancel={() => setCreating(false)} onCreate={(key, newSecret) => {
              setKeys((k) => [key, ...k]);
              setSecret(newSecret);
              setCreating(false);
            }} />
          </Card>
        )}
        {secret && <NewKeyNotice secret={secret} onDone={() => setSecret(null)} />}
        <Card title={copy.list} description={`${keys.length} key`}>
          {keys.length > 0 ? (
            <KeysTable keys={keys} onRevoke={(id) => setKeys((all) => all.filter((k) => k.id !== id))} />
          ) : (
            <EmptyState icon={Key01Icon} title={copy.empty.title} body={copy.empty.body}
              action={!creating && <button type="button" onClick={() => setCreating(true)} className={primaryAction()}>{copy.create}</button>} />
          )}
        </Card>
      </div>
    </>
  );
}
