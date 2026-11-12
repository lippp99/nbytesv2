// Markup as the admin types and reads it: percent text <-> basis points (100 = 1%). Integer only.
const MAX_MARKUP_BP = 30_000; // 300%: anything above is almost certainly a typo (same bound as the server contract)

/** "12" / "12.5" / "12,5" -> 1250 bp; null when empty, not a number, negative, or over 300%. */
export function parsePercentToBp(input: string): number | null {
  const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const bp = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return bp <= MAX_MARKUP_BP ? bp : null;
}

/** 1250 -> "12.5", 1000 -> "10" (no % sign: the field shows it). */
export function formatBp(bp: number): string {
  return (bp / 100).toFixed(2).replace(/\.?0+$/, "");
}
