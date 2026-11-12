import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NAME_MAX_LENGTH } from "@/lib/auth/auth-contract";
import { authCopy } from "./auth-copy";
import { errorText, fieldFocus } from "./field-styles";

const copy = authCopy.names;
export type NameField = "firstName" | "lastName";

type NameFieldsProps = {
  firstName: string;
  lastName: string;
  disabled: boolean;
  autoFocus: boolean;
  error: { field: NameField; message: string } | null;
  onChange: (field: NameField, value: string) => void;
};

/** First and last name of the register tab, side by side from 640px; an error shows under its own field. */
export function NameFields({ firstName, lastName, disabled, autoFocus, error, onChange }: NameFieldsProps) {
  const fields = [
    { field: "firstName", label: copy.firstLabel, placeholder: copy.firstPlaceholder, value: firstName, required: true },
    { field: "lastName", label: copy.lastLabel, placeholder: copy.lastPlaceholder, value: lastName, required: false },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ field, label, placeholder, value, required }, i) => {
        const message = error?.field === field ? error.message : null;
        return (
          <div key={field}>
            <Label htmlFor={field} className="text-sm">
              {label}
              {!required && <span className="font-normal text-muted-foreground">{copy.lastOptional}</span>}
            </Label>
            <Input
              id={field}
              name={field}
              autoComplete={required ? "given-name" : "family-name"}
              placeholder={placeholder}
              maxLength={NAME_MAX_LENGTH}
              autoFocus={autoFocus && i === 0}
              required={required}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(field, e.target.value)}
              aria-invalid={message ? true : undefined}
              aria-describedby={message ? `${field}-error` : undefined}
              className={cn("mt-2 h-12 px-4 text-base", fieldFocus)}
            />
            {message && <p id={`${field}-error`} role="alert" className={errorText}>{message}</p>}
          </div>
        );
      })}
    </div>
  );
}
