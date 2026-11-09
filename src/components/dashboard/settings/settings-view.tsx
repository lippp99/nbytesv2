"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { dangerAction, primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { PageHeader } from "@/components/app-kit/page-header";
import { settings as copy } from "./settings-copy";

const NAME_MAX = 60;

/** Settings row: what the section is about on the left, its controls in a card on the right. */
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

function ProfileForm() {
  const [name, setName] = useState(account.userName);
  const [team, setTeam] = useState(account.name);
  const [errors, setErrors] = useState<{ name?: string; team?: string }>({});
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    const next = { name: name.trim() ? undefined : copy.nameRequired, team: team.trim() ? undefined : copy.orgRequired };
    setErrors(next);
    setSaved(!next.name && !next.team);
  }

  return (
    <form noValidate onSubmit={save}>
      <Section title={copy.profile.title} body={copy.profile.body}>
        <Card>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <Field id="set-name" label={copy.name} error={errors.name}>
              <TextInput id="set-name" value={name} maxLength={NAME_MAX} autoComplete="name" aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy("set-name", { error: errors.name })} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
            </Field>
            <Field id="set-email" label={copy.email} hint={copy.emailNote}>
              <TextInput id="set-email" value={account.email} disabled aria-describedby={describedBy("set-email", { hint: copy.emailNote })} />
            </Field>
          </div>
        </Card>
      </Section>
      <Section title={copy.org.title} body={copy.org.body}>
        <Card>
          <div className="p-6 sm:max-w-sm">
            <Field id="set-team" label={copy.orgName} error={errors.team}>
              <TextInput id="set-team" value={team} maxLength={NAME_MAX} autoComplete="organization" aria-invalid={errors.team ? true : undefined}
                aria-describedby={describedBy("set-team", { error: errors.team })} onChange={(e) => { setTeam(e.target.value); setSaved(false); }} />
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

export function SettingsView() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <ProfileForm />
      <Section title={copy.danger.title} body={copy.danger.body}>
        <Card className="border-app-danger/40">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p id="delete-later" className="text-app-ui text-app-text-2">{copy.deleteDisabled}</p>
            <button type="button" disabled aria-describedby="delete-later" className={dangerAction()}>{copy.deleteAccount}</button>
          </div>
        </Card>
      </Section>
    </>
  );
}
