"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDollarsToMicros } from "@/lib/price-format";
import { apiKeysCopy as copy } from "./api-keys-copy";
import type { ApiKey } from "@/components/dashboard/shared/dashboard-data";
import { primaryAction, secondaryAction } from "@/components/dashboard/shared/dashboard-buttons";

const NAME_MAX = 40;
// `!`: ui/input merges with the bare `cn` package, which keeps its rounded-lg over our token.
const fieldClass = "mt-2 h-11 rounded-panel! px-3 text-sm";

// Demo only: a random string shaped like a key. The real key is created and hashed on the server.
function demoSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return `nb-live-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

type CreateKeyFormProps = { onCreate: (key: ApiKey, secret: string) => void; onCancel: () => void };

export function CreateKeyForm({ onCreate, onCancel }: CreateKeyFormProps) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<{ field: "name" | "budget"; text: string } | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError({ field: "name", text: copy.nameRequired });
    const budgetMicros = budget.trim() ? parseDollarsToMicros(budget) : null;
    if (budget.trim() && budgetMicros === null) return setError({ field: "budget", text: copy.budgetInvalid });
    const secret = demoSecret();
    const today = new Date().toISOString().slice(0, 10);
    onCreate(
      { id: secret.slice(-12), name: trimmed, preview: `nb-live-…${secret.slice(-4)}`, createdAt: today,
        lastUsedAt: null, budgetMicros, spentMicros: 0 },
      secret,
    );
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <div>
        <Label htmlFor="key-name" className="text-sm">{copy.name}</Label>
        <Input id="key-name" value={name} maxLength={NAME_MAX} autoFocus placeholder={copy.namePlaceholder}
          onChange={(e) => setName(e.target.value)} aria-invalid={error?.field === "name" || undefined}
          aria-describedby={error?.field === "name" ? "key-error" : undefined} className={fieldClass} />
      </div>
      <div>
        <Label htmlFor="key-budget" className="text-sm">{copy.budget}</Label>
        <Input id="key-budget" value={budget} inputMode="decimal" placeholder="50"
          onChange={(e) => setBudget(e.target.value)} aria-invalid={error?.field === "budget" || undefined}
          aria-describedby={error?.field === "budget" ? "key-error" : undefined} className={fieldClass} />
      </div>
      {error && <p id="key-error" role="alert" className="text-sm text-destructive sm:col-span-2">{error.text}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={primaryAction("rounded-full")}>{copy.save}</button>
        <button type="button" onClick={onCancel} className={secondaryAction("rounded-full")}>{copy.cancel}</button>
      </div>
    </form>
  );
}
