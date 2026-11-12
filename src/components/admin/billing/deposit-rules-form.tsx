"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";
import { DEPOSIT_RULE_BOUNDS, type DepositRules, parseDepositRulesBody } from "@/lib/payments/deposit-contract";
import { saveDepositRules } from "@/lib/payments/finance-settings-client";
import { billingCopy, rateErrorText } from "./billing-copy";

const copy = billingCopy.rules;
type Errors = { min?: string; max?: string; fee?: string; presets?: string };

const whole = (text: string) => (/^\d{1,9}$/.test(text.trim()) ? Number(text.trim()) : null);
/** "3" / "2,5" / "2.75" -> basis points (300 / 250 / 275); null when not a percent with at most two decimals. */
const percentToBp = (text: string) =>
  /^\d{1,2}([.,]\d{1,2})?$/.test(text.trim()) ? Math.round(Number(text.trim().replace(",", ".")) * 100) : null;
const bpToPercent = (bp: number) => String(bp / 100).replace(".", ",");
/** "100000, 50000" -> [50000, 100000]; empty text -> []; null when a part is not a whole number. */
function parsePresets(text: string): number[] | null {
  const parts = text.split(/[\s,;]+/).filter(Boolean).map(whole);
  return parts.every((p) => p !== null) ? (parts as number[]).sort((a, b) => a - b) : null;
}

/** Field errors for the four inputs, checked with the same bounds as the server contract. */
function check(min: number | null, max: number | null, fee: number | null, presets: number[] | null): Errors {
  const b = DEPOSIT_RULE_BOUNDS;
  const presetsOk = presets !== null && presets.length <= b.maxPresets && new Set(presets).size === presets.length &&
    (min === null || max === null || presets.every((p) => p >= min && p <= max));
  return {
    min: min === null || min < b.minIdr || min > b.maxIdr ? copy.minInvalid : undefined,
    max: max === null || max > b.maxIdr || (min !== null && max < min) ? copy.maxInvalid : undefined,
    fee: fee === null || fee > b.maxFeeBp ? copy.feeInvalid : undefined,
    presets: presetsOk ? undefined : copy.presetsInvalid,
  };
}

/** Minimum, maximum, fee and quick picks of a deposit, prefilled with the rules in force (B2, B3). */
export function DepositRulesForm({ rules }: { rules: DepositRules }) {
  const router = useRouter();
  const [text, setText] = useState({
    min: String(rules.minIdr), max: String(rules.maxIdr), fee: bpToPercent(rules.feeBp), presets: rules.presetsIdr.join(", "),
  });
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    const [minIdr, maxIdr, feeBp, presetsIdr] = [whole(text.min), whole(text.max), percentToBp(text.fee), parsePresets(text.presets)];
    const next = check(minIdr, maxIdr, feeBp, presetsIdr);
    setErrors(next);
    const body = parseDepositRulesBody({ minIdr, maxIdr, feeBp, presetsIdr });
    if (next.min || next.max || next.fee || next.presets || !body) return;
    setPending(true);
    const result = await saveDepositRules(body);
    setPending(false);
    if (!result.ok) {
      if (result.error === "unauthorized") return router.push("/admin/login");
      return setNotice({ kind: "error", text: result.error === "offline" ? rateErrorText.offline : copy.unavailable });
    }
    setNotice({ kind: "status", text: copy.saved });
    router.refresh();
  }

  const input = (key: keyof Errors, label: string, hint: string) => {
    const id = `deposit-${key}`;
    return (
      <Field id={id} label={label} hint={hint} error={errors[key]}>
        <TextInput id={id} inputMode={key === "fee" ? "decimal" : key === "presets" ? "text" : "numeric"} autoComplete="off"
          value={text[key]} disabled={pending}
          aria-invalid={errors[key] ? true : undefined} aria-describedby={describedBy(id, { hint, error: errors[key] })}
          className="font-mono tabular-nums"
          onChange={(e) => { setText({ ...text, [key]: e.target.value }); setErrors({ ...errors, [key]: undefined }); setNotice(null); }} />
      </Field>
    );
  };

  return (
    <Card title={copy.title} description={copy.description}>
      <form noValidate onSubmit={save} className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {input("min", copy.min, copy.amountHint)}
          {input("max", copy.max, copy.amountHint)}
          {input("fee", copy.fee, copy.feeHint)}
        </div>
        {input("presets", copy.presets, copy.presetsHint)}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} aria-busy={pending || undefined} className={primaryAction()}>
            {pending ? copy.saving : copy.save}
          </button>
          {notice && <NoticeLine notice={notice} size="small" />}
        </div>
      </form>
    </Card>
  );
}
