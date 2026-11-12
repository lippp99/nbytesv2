import type { BadgeTone } from "@/components/app-kit/badge";
import type { DepositFilter, DepositState } from "@/lib/payments/finance-contract";
import type { RateError } from "@/lib/payments/exchange-rate-client";

// Text of the admin Finance page: deposits (Sumopod QRIS) and the manual exchange rate (PRD gateway-pricing-billing).
export const billingCopy = {
  title: "Keuangan",
  sub: "Deposit rupiah lewat Sumopod dan kurs yang dipakai untuk mengubahnya menjadi saldo USD.",
  loading: "Memuat data keuangan",
  summary: "Ringkasan deposit bulan ini",
  stats: {
    received: "Rupiah diterima",
    paidCount: (n: number) => `${n} deposit lunas bulan ini (UTC)`,
    providerFee: "Biaya Sumopod",
    net: (amount: string) => `Dana bersih ${amount}`,
    credited: "Saldo dikreditkan",
    creditedNote: "Masuk ke saldo pengguna",
    stuck: "Deposit macet",
    stuckNote: (n: number) => (n ? "Cocokkan di dashboard Sumopod" : "Tidak ada yang tertahan"),
  },
  rate: {
    title: "Kurs",
    description: "Dikunci saat pengguna membuat deposit. Isi dengan kurs pasar + 4%.",
    current: "Kurs berlaku",
    value: (idr: string) => `1 USD = ${idr}`,
    setBy: (who: string, at: string) => `Diubah oleh ${who}, ${at} UTC`,
    deletedAdmin: "admin yang sudah dihapus",
    emptyTitle: "Kurs belum diisi",
    emptyBody: "Selama kurs kosong, semua permintaan deposit ditolak. Isi kurs di bawah untuk membukanya.",
    field: "Kurs baru (rupiah per 1 USD)",
    hint: "Angka bulat, tanpa titik. Contoh: 16850",
    invalid: "Isi angka bulat antara 1 dan 1.000.000.",
    save: "Simpan kurs",
    saving: "Menyimpan…",
    saved: "Kurs baru tersimpan dan berlaku untuk deposit berikutnya.",
    history: "Riwayat kurs",
    cols: { at: "Waktu (UTC)", rate: "Rupiah per USD", by: "Oleh" },
  },
  deposits: {
    title: "Deposit",
    description: "Terbaru di atas. Macet = belum lunas setelah kedaluwarsa; cocokkan order di Sumopod lalu kirim ulang webhook.",
    filterLabel: "Saring status deposit",
    cols: {
      at: "Waktu (UTC)", order: "Order", customer: "Pelanggan", paid: "Dibayar", rate: "Kurs", credit: "Saldo", fee: "Biaya Sumopod",
      status: "Status",
    },
    deletedAccount: "Akun dihapus",
    emptyTitle: "Belum ada deposit",
    emptyBody: "Deposit muncul di sini begitu pengguna membuatnya dari halaman Billing.",
    emptyFilteredTitle: "Tidak ada deposit dengan status ini",
    emptyFilteredBody: "Pilih status lain atau Semua untuk melihat deposit lain.",
    pagination: "Halaman daftar deposit",
    pageOf: (page: number, pages: number) => `Halaman ${page} dari ${pages}`,
    previous: "Sebelumnya",
    next: "Berikutnya",
  },
};

export const filterLabels: Record<DepositFilter, string> = {
  all: "Semua", paid: "Lunas", pending: "Menunggu", stuck: "Macet", failed: "Gagal", expired: "Kedaluwarsa",
};

export const stateBadge: Record<DepositState, { tone: BadgeTone; label: string }> = {
  paid: { tone: "success", label: "Lunas" },
  pending: { tone: "warning", label: "Menunggu" },
  stuck: { tone: "danger", label: "Macet" },
  failed: { tone: "danger", label: "Gagal" },
  expired: { tone: "neutral", label: "Kedaluwarsa" },
};

export const rateErrorText: Record<RateError, string> = {
  offline: "Tidak ada koneksi internet.",
  unauthorized: "Sesi admin berakhir. Silakan masuk lagi.",
  invalid_input: billingCopy.rate.invalid,
  unavailable: "Kurs belum tersimpan. Coba lagi sebentar lagi.",
};
