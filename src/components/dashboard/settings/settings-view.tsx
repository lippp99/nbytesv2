"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settings as copy } from "./settings-copy";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Panel } from "@/components/dashboard/shared/panel";
import { primaryAction, secondaryAction } from "@/components/dashboard/shared/dashboard-buttons";

const NAME_MAX = 60;
// `!`: ui/input merges with the bare `cn` package, which keeps its rounded-lg over our token.
const fieldClass = "mt-2 h-11 rounded-panel! px-3 text-sm";

export function SettingsView() {
  const [name, setName] = useState(account.userName);
  const [team, setTeam] = useState(account.name);
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <form onSubmit={save} className="mt-8 grid gap-3 lg:grid-cols-2">
        <Panel title={copy.profile}>
          <div className="space-y-5 p-4 sm:p-5">
            <div>
              <Label htmlFor="set-name" className="text-sm">{copy.name}</Label>
              <Input id="set-name" value={name} maxLength={NAME_MAX} autoComplete="name"
                onChange={(e) => { setName(e.target.value); setSaved(false); }} className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="set-email" className="text-sm">{copy.email}</Label>
              <Input id="set-email" value={account.email} readOnly aria-describedby="set-email-note"
                className={`${fieldClass} bg-muted text-muted-foreground`} />
              <p id="set-email-note" className="mt-2 text-sm text-muted-foreground">{copy.emailNote}</p>
            </div>
          </div>
        </Panel>
        <Panel title={copy.org}>
          <div className="p-4 sm:p-5">
            <Label htmlFor="set-team" className="text-sm">{copy.orgName}</Label>
            <Input id="set-team" value={team} maxLength={NAME_MAX} autoComplete="organization"
              onChange={(e) => { setTeam(e.target.value); setSaved(false); }} className={fieldClass} />
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button type="submit" className={primaryAction("rounded-full")}>{copy.save}</button>
          {saved && <p role="status" className="text-sm text-muted-foreground">{copy.saved}</p>}
        </div>
      </form>
      <Panel className="mt-10 border-destructive/40 p-4 sm:p-5">
        <h2 className="font-medium text-destructive">{copy.danger}</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{copy.dangerBody}</p>
        <button type="button" disabled className={secondaryAction("mt-4 rounded-full border-destructive/40 text-destructive")}>
          {copy.deleteAccount}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">{copy.deleteDisabled}</p>
      </Panel>
    </>
  );
}
