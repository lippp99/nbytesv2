import type { BadgeTone } from "@/components/app-kit/badge";
import type { PaymentStatus } from "./billing-data";

// Text of the admin Finance page.
export const billingCopy = {
  title: "Keuangan",
  sub: "Pendapatan, biaya upstream dan pembayaran terbaru bulan ini.",
  summary: "Ringkasan keuangan bulan ini",
  stats: { revenue: "Pendapatan", upstream: "Biaya upstream", margin: "Margin kotor", outstanding: "Belum dibayar" },
  refunds: (amount: string) => `Refund ${amount}`,
  payments: "Pembayaran terbaru",
  paymentsSub: "Top-up saldo dan tagihan bulanan",
  cols: { at: "Waktu (UTC)", customer: "Pelanggan", kind: "Jenis", method: "Metode", amount: "Jumlah", status: "Status" },
};

export const paymentBadge: Record<PaymentStatus, { tone: BadgeTone; label: string }> = {
  paid: { tone: "success", label: "Lunas" },
  pending: { tone: "warning", label: "Menunggu" },
  failed: { tone: "danger", label: "Gagal" },
  refunded: { tone: "neutral", label: "Direfund" },
};
