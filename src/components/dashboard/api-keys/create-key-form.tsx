"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { createApiKey } from "@/lib/gateway/keys/api-key-client";
import { KEY_NAME_MAX, MAX_BUDGET_MICROS } from "@/lib/gateway/keys/api-key-contract";
import { parseDollarsToMicros } from "@/lib/price-format";
import { apiKeyErrorText, apiKeysCopy as copy } from "./api-keys-copy";

type Errors = { name?: string; budget?: string };
type CreateKeyFormProps = { onCreated: (secret: string) => void; onCancel: () => void };

/** Same limits as parseCreateKeyBody on the server: name 1–40 after trimming, budget above 0 and at most $1,000,000. */
function check(name: string, budget: string): { errors: Errors; budgetMicros: number | null } {
  const budgetMicros = budget.trim() ? parseDollarsToMicros(budget) : null;
  let budgetError: string | undefined;
  if (budget.trim() && (budgetMicros === null || budgetMicros <= 0)) budgetError = copy.budgetInvalid;
  else if (budgetMicros !== null && budgetMicros > MAX_BUDGET_MICROS) budgetError = copy.budgetTooHigh;
  return { errors: { name: name.trim() ? undefined : copy.nameRequired, budget: budgetError }, budgetMicros };
}

export function CreateKeyForm({ onCreated, onCancel }: CreateKeyFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { errors: next, budgetMicros } = check(name, budget);
    setErrors(next);
    setFormError(null);
    if (next.name || next.budget) return;
    setPending(true);
    const result = await createApiKey({ name: name.trim(), monthlyBudgetMicros: budgetMicros });
    setPending(false);
    if (result.ok) return onCreated(result.key.key);
    if (result.error.kind === "unauthorized") return router.push("/login?next=%2Fapi-keys");
    setFormError(apiKeyErrorText(result.error));
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <Field id="key-name" label={copy.name} hint={copy.nameHint} error={errors.name}>
          <TextInput id="key-name" value={name} maxLength={KEY_NAME_MAX} autoFocus placeholder={copy.namePlaceholder}
            onChange={(e) => setName(e.target.value)} aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("key-name", { hint: copy.nameHint, error: errors.name })} />
        </Field>
        <Field id="key-budget" label={copy.budget} hint={copy.budgetHint} error={errors.budget}>
          <TextInput id="key-budget" value={budget} inputMode="decimal" placeholder="50"
            onChange={(e) => setBudget(e.target.value)} aria-invalid={errors.budget ? true : undefined}
            aria-describedby={describedBy("key-budget", { hint: copy.budgetHint, error: errors.budget })} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-app-border bg-app-inset px-6 py-4">
        {formError && <p role="alert" className="mr-auto text-app-small text-app-danger">{formError}</p>}
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryAction()}>{copy.cancel}</button>
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction()}>{pending ? copy.saving : copy.save}</button>
      </div>
    </form>
  );
}
