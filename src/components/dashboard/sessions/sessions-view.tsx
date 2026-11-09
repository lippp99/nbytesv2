"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { type UserAuthError, revokeOtherSessions, revokeSession } from "@/lib/auth/auth-client";
import type { ActiveSessionsPage } from "@/lib/auth/auth-contract";
import { sessionsCopy as copy } from "./sessions-copy";
import { SessionsPagination } from "./sessions-pagination";
import { SessionsTable } from "./sessions-table";

type Notice = { kind: "status" | "error"; text: string } | null;

/** The signed-in devices of this account; signing one out refetches the page from the server (router.refresh). */
export function SessionsView({ data }: { data: ActiveSessionsPage }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | "all" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const hasOthers = data.total > 1;

  function fail(error: UserAuthError) {
    if (error.kind === "unauthorized") return router.push("/login?next=%2Fsessions");
    setNotice({ kind: "error", text: copy.failed });
  }

  async function signOut(id: string) {
    setBusy(id);
    setNotice(null);
    const result = await revokeSession(id);
    setBusy(null);
    if (!result.ok) return fail(result.error);
    setNotice({ kind: "status", text: copy.revokedOne });
    router.refresh();
  }

  async function signOutOthers() {
    setBusy("all");
    setNotice(null);
    const result = await revokeOtherSessions();
    setBusy(null);
    if (!result.ok) return fail(result.error);
    setNotice({ kind: "status", text: result.revoked === 1 ? copy.revokedOne : copy.revokedMany(result.revoked) });
    router.refresh();
  }

  const action = hasOthers && (
    <button type="button" onClick={signOutOthers} disabled={busy !== null} aria-busy={busy === "all" || undefined}
      className={secondaryAction()}>
      {copy.signOutOthers}
    </button>
  );

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={action} />
      <Card>
        <SessionsTable sessions={data.sessions} busyId={busy === "all" ? null : busy} locked={busy !== null} onRevoke={signOut} />
        <SessionsPagination page={data.page} pages={data.pages} />
      </Card>
      <div className="mt-4 space-y-1 text-app-small">
        {!hasOthers && <p className="text-app-text-2">{copy.onlyThis}</p>}
        <p className="text-app-text-3">{copy.precision}</p>
        {notice?.kind === "status" && <p role="status" className="text-app-text-2">{notice.text}</p>}
        {notice?.kind === "error" && <p role="alert" className="text-app-danger">{notice.text}</p>}
      </div>
    </>
  );
}
