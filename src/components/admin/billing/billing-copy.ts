import type { BadgeTone } from "@/components/app-kit/badge";
import type { DepositFilter, DepositState } from "@/lib/payments/finance-contract";
import type { RateError } from "@/lib/payments/finance-settings-client";

// Text of the admin Finance page: deposits (Sumopod QRIS) and the manual exchange rate (PRD gateway-pricing-billing).
export const billingCopy = {
  title: "Billing",
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
  rules: {
    title: "Batas dan biaya deposit",
    description: "Berlaku untuk deposit berikutnya; deposit yang sudah dibuat tidak berubah.",
    min: "Minimal (rupiah)",
    max: "Maksimal (rupiah)",
    fee: "Biaya layanan (%)",
    amountHint: "Angka bulat, tanpa titik. Rp 10.000 sampai Rp 100.000.000.",
    feeHint: "0 sampai 20, boleh desimal. Contoh: 3 atau 2,5.",
    minInvalid: "Isi angka bulat antara 10000 dan 100000000.",
    maxInvalid: "Isi angka bulat, tidak kurang dari minimal dan paling besar 100000000.",
    feeInvalid: "Isi persen 0 sampai 20, paling banyak dua angka di belakang koma.",
    presets: "Pilihan nominal cepat (rupiah)",
    presetsHint:
      "Tombol nominal di halaman Billing pengguna. Angka tanpa titik, dipisah koma (spasi boleh), maksimal 8. " +
      "Contoh: 50000, 100000, 250000. Kosongkan untuk menyembunyikan.",
    presetsInvalid: "Isi angka bulat tanpa titik, dipisah koma, tidak ada yang sama, maksimal 8, semuanya di antara minimal dan maksimal.",
    save: "Simpan aturan deposit",
    saving: "Menyimpan…",
    saved: "Aturan deposit tersimpan dan berlaku untuk deposit berikutnya.",
    unavailable: "Aturan deposit belum tersimpan. Coba lagi sebentar lagi.",
  },
  deposits: {
    title: "Deposit",
    description: "Terbaru di atas. Macet = belum lunas setelah kedaluwarsa; cocokkan order di Sumopod lalu kirim ulang webhook.",
    filterLabel: "Saring status deposit",
    loadingResults: "Memuat…",
    copyOrder: "Salin order id lengkap",
    copiedOrder: "Order id tersalin",
    copyFailed: "Gagal menyalin. Pilih teksnya lalu salin manual.",
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
