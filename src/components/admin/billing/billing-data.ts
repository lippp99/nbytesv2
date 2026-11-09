// Mock finance data for the admin. Every number is an example; money in integer micro-dollars, dates in UTC.
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type Payment = { id: string; at: string; customer: string; kind: "Top-up" | "Tagihan"; method: string; amountMicros: number; status: PaymentStatus };

export const financeTotals = {
  revenueMonthMicros: 48_216_400_000,
  upstreamCostMonthMicros: 39_102_800_000,
  outstandingMicros: 1_830_000_000,
  refundsMonthMicros: 120_000_000,
};

export const payments: Payment[] = [
  { id: "pay_3021", at: "2026-11-08T08:40:00Z", customer: "ops@lumbung.example", kind: "Tagihan", method: "Transfer bank", amountMicros: 2_410_300_000, status: "pending" },
  { id: "pay_3020", at: "2026-11-08T07:12:00Z", customer: "rina@kopikode.example", kind: "Top-up", method: "Kartu ••4242", amountMicros: 50_000_000, status: "paid" },
  { id: "pay_3019", at: "2026-11-07T19:03:00Z", customer: "dev@arunika.example", kind: "Top-up", method: "Kartu ••1881", amountMicros: 25_000_000, status: "failed" },
  { id: "pay_3018", at: "2026-11-07T10:55:00Z", customer: "ai@sekolahku.example", kind: "Tagihan", method: "Virtual account", amountMicros: 402_900_000, status: "paid" },
  { id: "pay_3017", at: "2026-11-06T15:20:00Z", customer: "budi@toko.example", kind: "Top-up", method: "QRIS", amountMicros: 10_000_000, status: "paid" },
  { id: "pay_3016", at: "2026-11-05T09:00:00Z", customer: "x91@mailinator.example", kind: "Top-up", method: "Kartu ••0007", amountMicros: 120_000_000, status: "refunded" },
];
