"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";
import { PageHeader } from "@/components/app-kit/page-header";
import { revokeApiKey } from "@/lib/gateway/keys/api-key-client";
import { MAX_ACTIVE_KEYS, type UserApiKey } from "@/lib/gateway/keys/api-key-contract";
import { apiKeyErrorText, apiKeysCopy as copy } from "./api-keys-copy";
import { CreateKeyForm } from "./create-key-form";
import { KeysTable } from "./keys-table";
import { NewKeyNotice } from "./new-key-notice";

/** The user's active keys from the server; creating or revoking one refetches the page (router.refresh). */
export function ApiKeysView({ keys }: { keys: UserApiKey[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const atLimit = keys.length >= MAX_ACTIVE_KEYS;

  async function revoke(id: string) {
    const name = keys.find((k) => k.id === id)?.name ?? "";
    setBusyId(id);
    setNotice(null);
    const result = await revokeApiKey(id);
    setBusyId(null);
    // not_found: already revoked (another tab) or never ours; either way the row should go.
    if (!result.ok && result.error.kind === "unauthorized") return router.push("/login?next=%2Fapi-keys");
    if (!result.ok && result.error.kind !== "not_found") {
      return setNotice({ kind: "error", text: apiKeyErrorText(result.error, "revoke") });
    }
    setNotice({ kind: "status", text: copy.revoked(name) });
    router.refresh();
  }

  function created(newSecret: string) {
    setSecret(newSecret);
    setCreating(false);
    setNotice(null);
    router.refresh();
  }

  const createButton = (
    <button type="button" onClick={() => setCreating(true)} disabled={creating || atLimit} className={primaryAction()}>
      <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
      {copy.create}
    </button>
  );

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={createButton} />
      {atLimit && <p className="-mt-4 mb-6 text-app-small text-app-text-2">{copy.limitNote}</p>}
      <div className="space-y-6">
        {creating && (
          <Card title={copy.createTitle} description={copy.createSub}>
            <CreateKeyForm onCancel={() => setCreating(false)} onCreated={created} />
          </Card>
        )}
        {secret && <NewKeyNotice secret={secret} onDone={() => setSecret(null)} />}
        <div>
          {notice && <NoticeLine notice={notice} className="mb-3" />}
          <Card title={copy.list} description={copy.count(keys.length)}>
            {keys.length > 0 ? (
              <KeysTable keys={keys} busyId={busyId} onRevoke={revoke} />
            ) : (
              <EmptyState icon={Key01Icon} title={copy.empty.title} body={copy.empty.body}
                action={!creating && <button type="button" onClick={() => setCreating(true)} className={primaryAction()}>{copy.create}</button>} />
            )}
          </Card>
          <p className="mt-4 text-app-small text-app-text-3">{copy.resetNote}</p>
        </div>
      </div>
    </>
  );
}
