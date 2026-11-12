"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";
import { saveContacts } from "@/lib/support/contact-client";
import {
  CONTACT_CHANNELS, type ContactChannel, type ContactSettings, contactErrors, parseContactBody,
} from "@/lib/support/contact-contract";
import { contactCopy as copy } from "./contact-copy";

function ChannelRow({ channel, entry, error, disabled, onChange }: {
  channel: ContactChannel; entry: ContactSettings[ContactChannel]; error?: string; disabled: boolean;
  onChange: (next: ContactSettings[ContactChannel]) => void;
}) {
  const id = `contact-${channel}`;
  const { label, placeholder, hint } = copy.channels[channel];
  return (
    <div className="grid gap-3 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6">
      <Field id={id} label={label} hint={hint} error={error}>
        <TextInput id={id} value={entry.value} placeholder={placeholder} disabled={disabled} autoComplete="off"
          inputMode={channel === "whatsapp" ? "tel" : channel === "email" ? "email" : "text"}
          aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, { hint, error })}
          onChange={(e) => onChange({ ...entry, value: e.target.value })} />
      </Field>
      <label className="flex min-h-11 items-center gap-2.5 text-app-ui text-app-text sm:mt-7">
        <input type="checkbox" checked={entry.visible} disabled={disabled} className="size-5 shrink-0 accent-app-accent"
          onChange={(e) => onChange({ ...entry, visible: e.target.checked })} />
        {copy.show}
      </label>
    </div>
  );
}

/** Three channels, each a value and a show switch; checked with the same contract as the server before sending. */
export function ContactForm({ initial }: { initial: ContactSettings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<ContactChannel, string>>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    const found = contactErrors(values);
    const next: Partial<Record<ContactChannel, string>> = {};
    for (const c of CONTACT_CHANNELS) if (found[c]) next[c] = found[c] === "required" ? copy.required : copy.invalid[c];
    setErrors(next);
    const body = parseContactBody(values); // same normalizing as the server ("+62 812-…" -> "62812…")
    if (Object.keys(next).length > 0 || !body) return;
    setPending(true);
    const result = await saveContacts(body);
    setPending(false);
    if (!result.ok) {
      if (result.error === "unauthorized") return router.push("/admin/login");
      return setNotice({ kind: "error", text: result.error === "offline" ? copy.offline : copy.failed });
    }
    setValues(body); // show what was stored
    setNotice({ kind: "status", text: copy.saved });
  }

  return (
    <form noValidate onSubmit={save}>
      <Card title={copy.cardTitle} description={copy.cardSub}>
        <div className="divide-y divide-app-border">
          {CONTACT_CHANNELS.map((c) => (
            <ChannelRow key={c} channel={c} entry={values[c]} error={errors[c]} disabled={pending}
              onChange={(entry) => { setValues({ ...values, [c]: entry }); setErrors({ ...errors, [c]: undefined }); setNotice(null); }} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-app-border bg-app-inset px-6 py-4">
          {notice && <NoticeLine notice={notice} size="small" className="mr-auto" />}
          <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction()}>
            {pending ? copy.saving : copy.save}
          </button>
        </div>
      </Card>
    </form>
  );
}
