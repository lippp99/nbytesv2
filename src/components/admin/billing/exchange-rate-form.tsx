"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { parseExchangeRateBody } from "@/lib/payments/deposit-contract";
import { saveExchangeRate } from "@/lib/payments/exchange-rate-client";
import { billingCopy, rateErrorText } from "./billing-copy";

const copy = billingCopy.rate;
type Notice = { kind: "status" | "error"; text: string } | null;

/** One field and Save. The same contract as the server checks the value first, so most mistakes show under it. */
export function ExchangeRateForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    const body = /^\d+$/.test(value.trim()) ? parseExchangeRateBody({ idrPerUsd: Number(value.trim()) }) : null;
    if (!body) return setFieldError(copy.invalid);
    setFieldError(null);
    setPending(true);
    const result = await saveExchangeRate(body.idrPerUsd);
    setPending(false);
    if (!result.ok) {
      if (result.error === "unauthorized") return router.push("/admin/login");
      if (result.error === "invalid_input") return setFieldError(copy.invalid);
      return setNotice({ kind: "error", text: rateErrorText[result.error] });
    }
    setValue("");
    setNotice({ kind: "status", text: copy.saved });
    router.refresh(); // the rate in force and the history come from the server
  }

  return (
    <form noValidate onSubmit={save} className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="sm:w-72">
        <Field id="idr-per-usd" label={copy.field} hint={copy.hint} error={fieldError}>
          <TextInput id="idr-per-usd" inputMode="numeric" autoComplete="off" value={value} disabled={pending}
            aria-invalid={fieldError ? true : undefined} aria-describedby={describedBy("idr-per-usd", { hint: copy.hint, error: fieldError })}
            className="font-mono tabular-nums"
            onChange={(e) => { setValue(e.target.value); setFieldError(null); setNotice(null); }} />
        </Field>
      </div>
      <div className="flex flex-col gap-2 sm:pt-7">
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction("sm:self-start")}>
          {pending ? copy.saving : copy.save}
        </button>
        {notice && (
          <p role={notice.kind === "error" ? "alert" : "status"}
            className={notice.kind === "error" ? "text-app-small text-app-danger" : "text-app-small text-app-text-2"}>
            {notice.text}
          </p>
        )}
      </div>
    </form>
  );
}
