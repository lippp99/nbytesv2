"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import { updateProfile } from "@/lib/auth/auth-client";
import { NAME_MAX_LENGTH, type Profile, isValidName, normalizeName } from "@/lib/auth/auth-contract";
import { settings as copy, errorText } from "./settings-copy";

type NameField = "firstName" | "lastName";
type Errors = Partial<Record<NameField, string>>;
type Notice = { kind: "status" | "error"; text: string } | null;

/** Same contract as the server, so most mistakes show under their field before any request. */
function check(firstName: string, lastName: string): Errors {
  return {
    firstName: isValidName(firstName) ? undefined : copy.firstInvalid,
    lastName: !lastName.trim() || isValidName(lastName) ? undefined : copy.lastInvalid,
  };
}

const fields = {
  firstName: { label: copy.firstName, placeholder: copy.firstPlaceholder, autoComplete: "given-name" },
  lastName: { label: copy.lastName, placeholder: copy.lastPlaceholder, autoComplete: "family-name" },
} as const;

/** Name fields (saved to the account) and the read-only sign-in email. */
export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(profile);
  const [values, setValues] = useState({ firstName: profile.firstName, lastName: profile.lastName ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const lastName = values.lastName.trim() ? values.lastName : null;
  const changed =
    normalizeName(values.firstName) !== saved.firstName || (lastName && normalizeName(lastName)) !== saved.lastName;

  async function save(event: FormEvent) {
    event.preventDefault();
    const next = check(values.firstName, values.lastName);
    setErrors(next);
    setNotice(null);
    if (next.firstName || next.lastName) return;
    setPending(true);
    const result = await updateProfile({ firstName: values.firstName, lastName });
    setPending(false);
    if (!result.ok) {
      if (result.error.kind === "unauthorized") return router.push("/login?next=%2Fsettings");
      return setNotice({ kind: "error", text: errorText(result.error) });
    }
    setSaved(result.profile);
    setValues({ firstName: result.profile.firstName, lastName: result.profile.lastName ?? "" });
    setNotice({ kind: "status", text: copy.saved });
    router.refresh(); // the sidebar reads the name from the server
  }

  return (
    <form noValidate onSubmit={save}>
      <Card>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {(Object.keys(fields) as NameField[]).map((id) => (
            <Field key={id} id={id} label={fields[id].label} error={errors[id]}
              aside={id === "lastName" && <span className="text-app-small text-app-text-3">{copy.optional}</span>}>
              <TextInput id={id} value={values[id]} placeholder={fields[id].placeholder} autoComplete={fields[id].autoComplete}
                maxLength={NAME_MAX_LENGTH} disabled={pending} aria-invalid={errors[id] ? true : undefined}
                aria-describedby={describedBy(id, { error: errors[id] })}
                onChange={(e) => { setValues((v) => ({ ...v, [id]: e.target.value })); setNotice(null); }} />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Field id="email" label={copy.email} hint={copy.emailNote}>
              <TextInput id="email" value={email} readOnly disabled aria-describedby={describedBy("email", { hint: copy.emailNote })} />
            </Field>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-app-border bg-app-inset px-6 py-4">
          {notice?.kind === "status" && <p role="status" className="mr-auto text-app-small text-app-text-2">{notice.text}</p>}
          {notice?.kind === "error" && <p role="alert" className="mr-auto text-app-small text-app-danger">{notice.text}</p>}
          <button type="submit" disabled={!changed || pending} aria-busy={pending || undefined} className={primaryAction()}>
            {pending ? copy.saving : copy.save}
          </button>
        </div>
      </Card>
    </form>
  );
}
