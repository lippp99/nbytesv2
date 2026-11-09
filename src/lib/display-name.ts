// How the signed-in user is named in the dashboard. Accounts made before the register tab have no name: use the email.

type Person = { email: string; firstName: string | null; lastName: string | null };

/** "Siti Aisyah", "Budi", or the email when there is no name. */
export function displayName({ email, firstName, lastName }: Person): string {
  return [firstName, lastName].filter(Boolean).join(" ") || email;
}

/** Up to two capital letters for the avatar: "SA", "B", or the email's first letter. */
export function initialsOf(person: Person): string {
  const parts = person.firstName ? [person.firstName, person.lastName ?? ""] : [person.email];
  return parts.map((part) => Array.from(part)[0] ?? "").join("").toUpperCase();
}
