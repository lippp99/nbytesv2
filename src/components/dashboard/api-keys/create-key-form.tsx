"use client";

import { type FormEvent, useState } from "react";
import type { ApiKey } from "@/components/dashboard/shared/dashboard-data";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { parseDollarsToMicros } from "@/lib/price-format";
import { apiKeysCopy as copy } from "./api-keys-copy";

const NAME_MAX = 40;

// Demo only: a random string shaped like a key. The real key is created and hashed on the server.
function demoSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return `nb-live-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

type Errors = { name?: string; budget?: string };
type CreateKeyFormProps = { onCreate: (key: ApiKey, secret: string) => void; onCancel: () => void };

export function CreateKeyForm({ onCreate, onCancel }: CreateKeyFormProps) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    const budgetMicros = budget.trim() ? parseDollarsToMicros(budget) : null;
    const next: Errors = {
      name: trimmed ? undefined : copy.nameRequired,
      budget: budget.trim() && budgetMicros === null ? copy.budgetInvalid : undefined,
    };
    setErrors(next);
    if (next.name || next.budget) return;
    const secret = demoSecret();
    onCreate(
      { id: secret.slice(-12), name: trimmed, preview: `nb-live-…${secret.slice(-4)}`, createdAt: new Date().toISOString().slice(0, 10),
        lastUsedAt: null, budgetMicros, spentMicros: 0 },
      secret,
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <Field id="key-name" label={copy.name} hint={copy.nameHint} error={errors.name}>
          <TextInput id="key-name" value={name} maxLength={NAME_MAX} autoFocus placeholder={copy.namePlaceholder}
            onChange={(e) => setName(e.target.value)} aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("key-name", { hint: copy.nameHint, error: errors.name })} />
        </Field>
        <Field id="key-budget" label={copy.budget} hint={copy.budgetHint} error={errors.budget}>
          <TextInput id="key-budget" value={budget} inputMode="decimal" placeholder="50"
            onChange={(e) => setBudget(e.target.value)} aria-invalid={errors.budget ? true : undefined}
            aria-describedby={describedBy("key-budget", { hint: copy.budgetHint, error: errors.budget })} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-app-border bg-app-inset px-6 py-4">
        <button type="button" onClick={onCancel} className={secondaryAction()}>{copy.cancel}</button>
        <button type="submit" className={primaryAction()}>{copy.save}</button>
      </div>
    </form>
  );
}
