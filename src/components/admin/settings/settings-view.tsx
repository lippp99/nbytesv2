"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, Select, TextInput, describedBy } from "@/components/app-kit/field";
import { PageHeader } from "@/components/app-kit/page-header";
import { settingsCopy as copy } from "./settings-copy";

const BANNER_MAX = 140;

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

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={`${id}-hint`}
        className="mt-0.5 size-5 shrink-0 accent-app-accent" />
      <div>
        <label htmlFor={id} className="text-app-ui font-medium text-app-text">{label}</label>
        <p id={`${id}-hint`} className="mt-0.5 text-app-small text-app-text-3">{hint}</p>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [signup, setSignup] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [banner, setBanner] = useState("");
  const [rpm, setRpm] = useState("600");
  const [errors, setErrors] = useState<{ banner?: string; rpm?: string }>({});
  const [saved, setSaved] = useState(false);
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setSaved(false); };

  function save(event: FormEvent) {
    event.preventDefault();
    const n = Number(rpm);
    const next = {
      banner: maintenance && !banner.trim() ? copy.bannerRequired : undefined,
      rpm: /^\d+$/.test(rpm) && n >= 1 && n <= 10_000 ? undefined : copy.rpmInvalid,
    };
    setErrors(next);
    setSaved(!next.banner && !next.rpm);
  }

  return (
    <form noValidate onSubmit={save}>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Section title={copy.access.title} body={copy.access.body}>
        <Card>
          <div className="space-y-6 p-6">
            <Toggle id="set-signup" label={copy.signup} hint={copy.signupHint} checked={signup} onChange={edit(setSignup)} />
            <Toggle id="set-maint" label={copy.maintenance} hint={copy.maintenanceHint} checked={maintenance} onChange={edit(setMaintenance)} />
            <Field id="set-banner" label={copy.banner} error={errors.banner}>
              <TextInput id="set-banner" value={banner} maxLength={BANNER_MAX} placeholder={copy.bannerPlaceholder} disabled={!maintenance}
                aria-invalid={errors.banner ? true : undefined} aria-describedby={describedBy("set-banner", { error: errors.banner })}
                onChange={(e) => edit(setBanner)(e.target.value)} />
            </Field>
          </div>
        </Card>
      </Section>
      <Section title={copy.limits.title} body={copy.limits.body}>
        <Card>
          <div className="p-6 sm:max-w-xs">
            <Field id="set-rpm" label={copy.rpm} hint={copy.rpmHint} error={errors.rpm}>
              <TextInput id="set-rpm" inputMode="numeric" value={rpm} aria-invalid={errors.rpm ? true : undefined}
                aria-describedby={describedBy("set-rpm", { hint: copy.rpmHint, error: errors.rpm })}
                onChange={(e) => edit(setRpm)(e.target.value)} className="font-mono" />
            </Field>
          </div>
        </Card>
      </Section>
      <Section title={copy.session.title} body={copy.session.body}>
        <Card>
          <div className="p-6 sm:max-w-xs">
            <Field id="set-session" label={copy.sessionLength}>
              <Select id="set-session" defaultValue={copy.sessionOptions[1]} onChange={() => setSaved(false)}>
                {copy.sessionOptions.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-app-border bg-app-inset px-6 py-4">
            {saved && <p role="status" className="mr-auto text-app-small text-app-text-2">{copy.saved}</p>}
            <button type="submit" className={primaryAction()}>{copy.save}</button>
          </div>
        </Card>
      </Section>
    </form>
  );
}
