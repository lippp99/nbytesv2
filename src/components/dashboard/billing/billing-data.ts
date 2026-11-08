// Mock invoices for the Billing page. Money is integer micro-dollars.

export type Invoice = { id: string; period: string; amountMicros: number; status: "paid" | "open" };

export const invoices: Invoice[] = [
  { id: "INV-2026-11", period: "November 2026", amountMicros: 182_400_000, status: "open" },
  { id: "INV-2026-10", period: "Oktober 2026", amountMicros: 164_200_000, status: "paid" },
  { id: "INV-2026-09", period: "September 2026", amountMicros: 151_800_000, status: "paid" },
  { id: "INV-2026-08", period: "Agustus 2026", amountMicros: 97_350_000, status: "paid" },
];
