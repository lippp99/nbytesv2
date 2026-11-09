"use client";

import { useState } from "react";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { formatBp, parsePercentToBp } from "./margin-math";
import { modelsCopy } from "./models-copy";

const copy = modelsCopy.rules;

type MarginRulesProps = { modelCount: number; topUpFeeBp: number; onApplyAll: (bp: number) => void; onTopUpFee: (bp: number) => void };

/** Global levers: one markup pushed to every model, and the top-up fee. Per-model overrides live in the table. */
export function MarginRules({ modelCount, topUpFeeBp, onApplyAll, onTopUpFee }: MarginRulesProps) {
  const [markup, setMarkup] = useState("15");
  const [fee, setFee] = useState(formatBp(topUpFeeBp).replace("%", ""));
  const [markupError, setMarkupError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  function apply() {
    const bp = parsePercentToBp(markup);
    setMarkupError(bp === null ? copy.invalid : null);
    setApplied(bp !== null);
    if (bp !== null) onApplyAll(bp);
  }

  function changeFee(value: string) {
    setFee(value);
    const bp = parsePercentToBp(value);
    setFeeError(bp === null ? copy.invalid : null);
    if (bp !== null) onTopUpFee(bp);
  }

  return (
    <Card title={copy.title} description={copy.description}>
      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <div>
          <Field id="rule-markup" label={copy.markup} hint={copy.markupHint} error={markupError}>
            <div className="flex gap-2">
              <TextInput id="rule-markup" inputMode="decimal" value={markup} className="max-w-28 font-mono"
                aria-invalid={markupError ? true : undefined}
                aria-describedby={describedBy("rule-markup", { hint: copy.markupHint, error: markupError })}
                onChange={(e) => { setMarkup(e.target.value); setApplied(false); }} />
              <button type="button" onClick={apply} className={secondaryAction()}>{copy.apply}</button>
            </div>
          </Field>
          {applied && <p role="status" className="mt-2 text-app-small text-app-success">{copy.applied(modelCount)}</p>}
        </div>
        <Field id="rule-fee" label={copy.topUp} hint={copy.topUpHint} error={feeError}>
          <TextInput id="rule-fee" inputMode="decimal" value={fee} className="max-w-28 font-mono"
            aria-invalid={feeError ? true : undefined}
            aria-describedby={describedBy("rule-fee", { hint: copy.topUpHint, error: feeError })}
            onChange={(e) => changeFee(e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}
