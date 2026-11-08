const MICROS_PER_DOLLAR = 1_000_000;

/** Formats integer micro-dollars as USD with 2 to 6 decimals, without float math. */
export function formatMicros(micros: number): string {
  if (!Number.isSafeInteger(micros) || micros < 0) {
    throw new RangeError(`micros must be a non-negative integer, got ${micros}`);
  }
  const dollars = Math.floor(micros / MICROS_PER_DOLLAR);
  const fraction = String(micros % MICROS_PER_DOLLAR).padStart(6, "0").replace(/0+$/, "").padEnd(2, "0");
  return `$${dollars.toLocaleString("en-US")}.${fraction}`;
}

const DOLLAR_INPUT = /^(\d{1,7})(?:[.,](\d{1,2}))?$/;

/** "40" / "40.5" / "40,50" -> integer micro-dollars; null for anything else (string math, no floats). */
export function parseDollarsToMicros(input: string): number | null {
  const match = DOLLAR_INPUT.exec(input.trim());
  if (!match) return null;
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return Number(match[1]) * MICROS_PER_DOLLAR + cents * 10_000;
}
