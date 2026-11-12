import type { BadgeTone } from "@/components/app-kit/badge";
import type { UserDeposit } from "@/lib/payments/deposit-contract";
import type { DepositError } from "@/lib/payments/deposit-client";

// Text of the Billing page: prepaid USD balance, deposits in rupiah via QRIS (PRD gateway-pricing-billing §5, §6, §11).
export const billing = {
  title: "Billing",
  sub: "Isi saldo dengan rupiah lewat QRIS. Saldo disimpan dalam USD dan dipotong setiap kali API dipakai.",
  loading: "Memuat billing",
  balance: "Saldo tersedia",
  held: (amount: string) => `${amount} sedang ditahan untuk request yang berjalan`,
  negative: "Saldo minus. Request baru ditolak sampai saldo diisi lagi.",
  balanceNote: "Saldo tidak bisa diuangkan kembali.",
  deposit: {
    title: "Isi saldo",
    description: "Bayar dengan QRIS dari aplikasi bank atau e-wallet. Saldo masuk otomatis setelah pembayaran terkonfirmasi.",
    presets: "Pilih nominal",
    custom: "Nominal lain (rupiah)",
    customHint: (min: string, max: string) => `Antara ${min} dan ${max}, tanpa titik.`,
    invalid: (min: string, max: string) => `Isi angka bulat antara ${min} dan ${max}.`,
    preview: "Rincian",
    amount: "Nominal",
    fee: "Biaya layanan 3%",
    total: "Total bayar",
    rate: "Kurs",
    rateValue: (idr: string) => `1 USD = ${idr}`,
    credit: "Saldo masuk",
    rateNote: "Kurs dikunci saat Anda menekan Bayar dan berlaku 24 jam.",
    pay: "Bayar dengan QRIS",
    paying: "Membuat pembayaran…",
    closedTitle: "Isi saldo belum tersedia",
    closedBody: "Kurs belum diatur oleh admin. Coba lagi nanti.",
  },
  history: {
    title: "Riwayat deposit",
    description: "Deposit yang menunggu bisa dibayar sampai batas waktunya.",
    cols: { at: "Waktu (UTC)", amount: "Nominal", paid: "Dibayar", rate: "Kurs", credit: "Saldo masuk", status: "Status" },
    resume: "Lanjut bayar",
    emptyTitle: "Belum ada deposit",
    emptyBody: "Isi saldo pertama Anda di atas. Minimal Rp 50.000.",
    pagination: "Halaman riwayat deposit",
    pageOf: (page: number, pages: number) => `Halaman ${page} dari ${pages}`,
    previous: "Sebelumnya",
    next: "Berikutnya",
  },
  // After Sumopod sends the user back (/billing?deposit=...). Only the webhook credits; this shows what we know now.
  returned: {
    paid: (credit: string) => `Pembayaran diterima. ${credit} sudah masuk ke saldo Anda.`,
    pending: "Pembayaran belum terkonfirmasi. Saldo masuk otomatis begitu QRIS dibayar; muat ulang halaman ini untuk melihatnya.",
    stuck: "Batas waktu pembayaran sudah lewat dan belum ada konfirmasi. Jika Anda sudah membayar, admin akan mencocokkannya dengan Sumopod.",
    failed: "Pembayaran gagal. Saldo tidak berubah; silakan buat deposit baru.",
    expired: "Pembayaran kedaluwarsa. Saldo tidak berubah; silakan buat deposit baru.",
  },
};

export const depositBadge: Record<UserDeposit["state"], { tone: BadgeTone; label: string }> = {
  paid: { tone: "success", label: "Lunas" },
  pending: { tone: "warning", label: "Menunggu" },
  stuck: { tone: "danger", label: "Belum terkonfirmasi" },
  failed: { tone: "danger", label: "Gagal" },
  expired: { tone: "neutral", label: "Kedaluwarsa" },
};

export function depositErrorText(error: DepositError, invalid: string): string {
  switch (error.kind) {
    case "offline":
      return "Tidak ada koneksi internet.";
    case "invalid_input":
      return invalid;
    case "rate_limited":
      return `Terlalu banyak permintaan deposit. Coba lagi dalam ${error.retryAfterMinutes} menit.`;
    case "unauthorized":
      return "Sesi Anda sudah berakhir. Silakan masuk lagi.";
    case "unavailable":
      return "Pembayaran belum bisa dibuat. Coba lagi sebentar lagi.";
  }
}
