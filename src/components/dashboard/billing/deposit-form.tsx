"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { appFocus, primaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import {
  type DepositQuote, type DepositRules, parseDepositBody, quoteDeposit,
} from "@/lib/payments/deposit-contract";
import { createDeposit } from "@/lib/payments/deposit-client";
import { formatIdr, formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billing, depositErrorText } from "./billing-copy";

const copy = billing.deposit;

const chip =
  `h-10 rounded-app-control border border-app-border-strong bg-app-surface px-3 font-mono text-app-code tabular-nums ` +
  `text-app-text transition-colors duration-150 hover:bg-app-hover aria-pressed:border-app-accent ` +
  `aria-pressed:bg-app-accent-soft aria-pressed:text-app-accent-text disabled:opacity-50 ${appFocus}`;

/** Digits only -> whole rupiah inside the deposit limits, else null (same contract as the server). */
const parseAmount = (text: string, rules: DepositRules) =>
  /^\d{1,9}$/.test(text.trim()) ? parseDepositBody({ amountIdr: Number(text.trim()) }, rules) : null;

/** Preset or own amount, the full breakdown before paying (§5.4), then off to the Sumopod payment page. */
export function DepositForm({ idrPerUsd, rules }: { idrPerUsd: number; rules: DepositRules }) {
  const router = useRouter();
  const presets = rules.presetsIdr; // set by the admin, already inside min..max (deposit-rules contract)
  const [text, setText] = useState(String(presets[0] ?? rules.minIdr));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [min, max] = [formatIdr(rules.minIdr), formatIdr(rules.maxIdr)];
  const invalid = copy.invalid(min, max);
  const amount = parseAmount(text, rules)?.amountIdr ?? null;
  const quote = amount === null ? null : quoteDeposit(amount, idrPerUsd, rules.feeBp);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (amount === null) return setError(invalid);
    setError(null);
    setPending(true);
    const result = await createDeposit(amount);
    if (result.ok) return window.location.assign(result.deposit.paymentLinkUrl); // stays "paying" while the page leaves
    setPending(false);
    if (result.error.kind === "unauthorized") return router.push("/login?next=%2Fbilling");
    setError(depositErrorText(result.error, invalid));
  }

  return (
    <form noValidate onSubmit={pay} className="grid gap-8 p-6 lg:grid-cols-2">
      <div className="space-y-6">
        {presets.length > 0 && (
          <fieldset disabled={pending}>
            <legend className="text-app-ui font-medium text-app-text">{copy.presets}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button key={preset} type="button" aria-pressed={amount === preset} className={chip}
                  onClick={() => { setText(String(preset)); setError(null); }}>
                  {formatIdr(preset)}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <Field id="deposit-amount" label={copy.custom} hint={copy.customHint(min, max)} error={error}>
          <TextInput id="deposit-amount" inputMode="numeric" autoComplete="off" value={text} disabled={pending}
            className="font-mono tabular-nums" aria-invalid={error ? true : undefined}
            aria-describedby={describedBy("deposit-amount", { hint: copy.customHint(min, max), error })}
            onChange={(e) => { setText(e.target.value); setError(null); }} />
        </Field>
      </div>
      <div className="rounded-app-control border border-app-border bg-app-inset p-5">
        <DepositPreview quote={quote} idrPerUsd={idrPerUsd} feeBp={rules.feeBp} />
        <p className="mt-3 text-app-small text-app-text-3">{copy.rateNote}</p>
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction("mt-5 w-full")}>
          {pending ? copy.paying : copy.pay}
        </button>
      </div>
    </form>
  );
}

/** What the user pays and gets, before paying; dashes while the amount is not valid. */
function DepositPreview({ quote, idrPerUsd, feeBp }: { quote: DepositQuote | null; idrPerUsd: number; feeBp: number }) {
  const rows: [string, string][] = [
    [copy.amount, quote ? formatIdr(quote.amountIdr) : "–"],
    [copy.fee(String(feeBp / 100).replace(".", ",")), quote ? formatIdr(quote.feeIdr) : "–"],
    [copy.total, quote ? formatIdr(quote.totalIdr) : "–"],
    [copy.rate, copy.rateValue(formatIdr(idrPerUsd))],
    [copy.credit, quote ? formatMicros(quote.creditMicros) : "–"],
  ];
  return (
    <>
      <h3 className="text-app-card text-app-text">{copy.preview}</h3>
      <dl className="mt-3 divide-y divide-app-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-app-ui text-app-text-2">{label}</dt>
            <dd className={cn("font-mono text-app-code text-app-text tabular-nums", label === copy.total && "font-medium")}>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
