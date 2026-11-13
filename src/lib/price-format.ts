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

/**
 * Rounded to whole cents (half up), for totals compared at a glance: 5_177_871 -> "$5.18", 1e9 -> "$1,000.00".
 * Always two decimals, so a thousand ("$1,000.00") never reads like "$1.000". Above zero but under half a cent -> "<$0.01".
 */
export function formatCents(micros: number): string {
  if (!Number.isSafeInteger(micros) || micros < 0) throw new RangeError(`micros must be a non-negative integer, got ${micros}`);
  const cents = Math.floor((micros + 5_000) / 10_000);
  if (cents === 0 && micros > 0) return "<$0.01";
  return `$${Math.floor(cents / 100).toLocaleString("en-US")}.${String(cents % 100).padStart(2, "0")}`;
}

export const formatSignedCents = (micros: number) => (micros < 0 ? `−${formatCents(-micros)}` : formatCents(micros));

/** A balance, which may be slightly negative (billing B7): -120000 -> "−$0.12". */
export function formatSignedMicros(micros: number): string {
  return micros < 0 ? `−${formatMicros(-micros)}` : formatMicros(micros);
}

/** Whole rupiah with Indonesian dot grouping: 103000 -> "Rp 103.000" (no Intl, same output on server and client). */
export function formatIdr(rupiah: number): string {
  if (!Number.isSafeInteger(rupiah) || rupiah < 0) throw new RangeError(`rupiah must be a non-negative integer, got ${rupiah}`);
  return `Rp ${String(rupiah).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const DOLLAR_INPUT = /^(\d{1,7})(?:[.,](\d{1,2}))?$/;

/** "40" / "40.5" / "40,50" -> integer micro-dollars; null for anything else (string math, no floats). */
export function parseDollarsToMicros(input: string): number | null {
  const match = DOLLAR_INPUT.exec(input.trim());
  if (!match) return null;
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return Number(match[1]) * MICROS_PER_DOLLAR + cents * 10_000;
}
