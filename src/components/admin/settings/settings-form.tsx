"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { dangerAction, primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, Select, TextInput, describedBy } from "@/components/app-kit/field";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";
import { savePlatformSettings } from "@/lib/platform/admin-client";
import {
  ADMIN_SESSION_HOURS, type AdminSessionHours, BANNER_MAX, type PlatformSettings, parseSettingsBody, settingsErrors,
} from "@/lib/platform/platform-settings-contract";
import { fieldErrorText, settingsCopy as copy } from "./settings-copy";

function Section({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-app-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-3 lg:gap-10">
      <div>
        <h2 className="text-app-card text-app-text">{title}</h2>
        <p className="mt-1 text-app-ui text-app-text-2">{body}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

function Toggle({ id, label, hint, checked, disabled, onChange }: {
  id: string; label: string; hint: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)}
        aria-describedby={`${id}-hint`} className="mt-0.5 size-5 shrink-0 accent-app-accent" />
      <div>
        <label htmlFor={id} className="text-app-ui font-medium text-app-text">{label}</label>
        <p id={`${id}-hint`} className="mt-0.5 text-app-small text-app-text-3">{hint}</p>
      </div>
    </div>
  );
}

type Values = Omit<PlatformSettings, "keyRpm"> & { keyRpm: string };
type Shown = ReturnType<typeof settingsErrors>;

function AccessCard({ v, shown, pending, edit }: { v: Values; shown: Shown; pending: boolean; edit: (next: Partial<Values>) => void }) {
  return (
    <Card>
      <div className="space-y-6 p-6">
        <Toggle id="set-signup" label={copy.signup} hint={copy.signupHint} checked={v.signupOpen} disabled={pending}
          onChange={(signupOpen) => edit({ signupOpen })} />
        <Toggle id="set-maint" label={copy.maintenance} hint={copy.maintenanceHint} checked={v.maintenance} disabled={pending}
          onChange={(maintenance) => edit({ maintenance })} />
        <Field id="set-banner" label={copy.banner} hint={copy.bannerHint} error={shown.banner && fieldErrorText[shown.banner]}>
          <TextInput id="set-banner" value={v.banner} maxLength={BANNER_MAX} placeholder={copy.bannerPlaceholder} disabled={pending}
            aria-invalid={shown.banner ? true : undefined}
            aria-describedby={describedBy("set-banner", { hint: copy.bannerHint, error: shown.banner })}
            onChange={(e) => edit({ banner: e.target.value })} />
        </Field>
      </div>
    </Card>
  );
}

function RateCard({ v, shown, pending, edit }: { v: Values; shown: Shown; pending: boolean; edit: (next: Partial<Values>) => void }) {
  return (
    <Card>
      <div className="p-6 sm:max-w-sm">
        <Field id="set-rpm" label={copy.rpm} hint={copy.rpmHint} error={shown.keyRpm && fieldErrorText[shown.keyRpm]}>
          <TextInput id="set-rpm" inputMode="numeric" value={v.keyRpm} disabled={pending} className="font-mono tabular-nums"
            aria-invalid={shown.keyRpm ? true : undefined}
            aria-describedby={describedBy("set-rpm", { hint: copy.rpmHint, error: shown.keyRpm })}
            onChange={(e) => edit({ keyRpm: e.target.value })} />
        </Field>
      </div>
    </Card>
  );
}

/** Last card of the page, so it also carries the form footer (`children`). */
function SessionCard({ v, pending, edit, children }: {
  v: Values; pending: boolean; edit: (next: Partial<Values>) => void; children: ReactNode;
}) {
  return (
    <Card>
      <div className="p-6 sm:max-w-sm">
        <Field id="set-session" label={copy.sessionLength} hint={copy.sessionHint}>
          <Select id="set-session" value={String(v.adminSessionHours)} disabled={pending}
            aria-describedby={describedBy("set-session", { hint: copy.sessionHint })}
            onChange={(e) => edit({ adminSessionHours: Number(e.target.value) as AdminSessionHours })}>
            {ADMIN_SESSION_HOURS.map((h) => <option key={h} value={h}>{copy.hours(h)}</option>)}
          </Select>
        </Field>
      </div>
      {children}
    </Card>
  );
}

/** Save button and the last result; or, before maintenance goes on, the question that confirms it. */
function Footer({ confirming, notice, pending, onCancel, onConfirm }: {
  confirming: boolean; notice: Notice | null; pending: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-app-border bg-app-inset px-6 py-4">
      {confirming ? (
        <>
          <p role="alert" className="mr-auto text-app-small text-app-text">{copy.confirmMaintenance}</p>
          <button type="button" onClick={onCancel} className={secondaryAction()}>{copy.cancel}</button>
          <button type="button" onClick={onConfirm} className={dangerAction()}>{copy.confirmYes}</button>
        </>
      ) : (
        <>
          {notice && <NoticeLine notice={notice} size="small" className="mr-auto" />}
          <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction()}>
            {pending ? copy.saving : copy.save}
          </button>
        </>
      )}
    </div>
  );
}

/** The real settings (lib/platform), checked with the same contract as the server; turning maintenance on asks first. */
export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState<Values>({ ...initial, keyRpm: String(initial.keyRpm) });
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const draft: PlatformSettings = { ...v, keyRpm: /^\d{1,6}$/.test(v.keyRpm.trim()) ? Number(v.keyRpm.trim()) : Number.NaN };
  const errors = settingsErrors(draft);
  const shown = showErrors ? errors : {};
  const edit = (next: Partial<Values>) => { setV({ ...v, ...next }); setNotice(null); setConfirming(false); };

  async function send() {
    const body = parseSettingsBody(draft);
    if (!body) return;
    setConfirming(false);
    setPending(true);
    const result = await savePlatformSettings(body);
    setPending(false);
    if (!result.ok) {
      if (result.error === "unauthorized") return router.push("/admin/login");
      return setNotice({ kind: "error", text: result.error === "offline" ? copy.offline : copy.failed });
    }
    setSaved(body);
    setV({ ...body, keyRpm: String(body.keyRpm) });
    setNotice({ kind: "status", text: copy.saved });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length) return;
    if (draft.maintenance && !saved.maintenance) return setConfirming(true); // risky action (PRD A.7): ask first
    void send();
  }

  return (
    <form noValidate onSubmit={submit}>
      <Section title={copy.access.title} body={copy.access.body}>
        <AccessCard v={v} shown={shown} pending={pending} edit={edit} />
      </Section>
      <Section title={copy.limits.title} body={copy.limits.body}>
        <RateCard v={v} shown={shown} pending={pending} edit={edit} />
      </Section>
      <Section title={copy.session.title} body={copy.session.body}>
        <SessionCard v={v} pending={pending} edit={edit}>
          <Footer confirming={confirming} notice={notice} pending={pending} onCancel={() => setConfirming(false)}
            onConfirm={() => void send()} />
        </SessionCard>
      </Section>
    </form>
  );
}
