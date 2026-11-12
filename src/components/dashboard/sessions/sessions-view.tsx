"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";
import { PageHeader } from "@/components/app-kit/page-header";
import { type UserAuthError, revokeOtherSessions, revokeSession } from "@/lib/auth/auth-client";
import type { ActiveSessionsPage } from "@/lib/auth/auth-contract";
import { sessionsCopy as copy } from "./sessions-copy";
import { SessionsPagination } from "./sessions-pagination";
import { SessionsTable } from "./sessions-table";

/** The signed-in devices of this account; signing one out refetches the page from the server (router.refresh). */
export function SessionsView({ data }: { data: ActiveSessionsPage }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | "all" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const hasOthers = data.total > 1;

  function fail(error: UserAuthError) {
    if (error.kind === "unauthorized") return router.push("/login?next=%2Fsessions");
    setNotice({ kind: "error", text: copy.failed });
  }

  async function signOut(id: string) {
    const device = data.sessions.find((s) => s.id === id)?.device ?? "";
    setBusy(id);
    setNotice(null);
    const result = await revokeSession(id);
    setBusy(null);
    if (!result.ok) return fail(result.error);
    setNotice({ kind: "status", text: copy.revokedOne(device) });
    router.refresh();
  }

  async function signOutOthers() {
    setBusy("all");
    setNotice(null);
    const result = await revokeOtherSessions();
    setBusy(null);
    if (!result.ok) return fail(result.error);
    setNotice({ kind: "status", text: copy.revokedMany(result.revoked) });
    router.refresh();
  }

  const action = hasOthers && (
    <button type="button" onClick={signOutOthers} disabled={busy !== null} aria-busy={busy === "all" || undefined}
      className={secondaryAction()}>
      {busy === "all" ? copy.signingOut : copy.signOutOthers}
    </button>
  );

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} action={action} />
      {notice && <NoticeLine notice={notice} className="mb-3" />}
      <Card>
        <SessionsTable sessions={data.sessions} busyId={busy === "all" ? null : busy} locked={busy !== null} onRevoke={signOut} />
        <SessionsPagination page={data.page} pages={data.pages} />
      </Card>
      <div className="mt-4 space-y-1 text-app-small">
        {!hasOthers && <p className="text-app-text-2">{copy.onlyThis}</p>}
        <p className="text-app-text-3">{copy.precision}</p>
      </div>
    </>
  );
}
