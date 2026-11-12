import type { ApiKeyError } from "@/lib/gateway/keys/api-key-client";
import { MAX_ACTIVE_KEYS, MAX_BUDGET_MICROS } from "@/lib/gateway/keys/api-key-contract";
import { formatMicros } from "@/lib/price-format";

// Text of the API Keys page (shared/common-copy.ts holds the labels every page uses).
export const apiKeysCopy = {
  title: "API Keys",
  sub: "Key dipakai di header Authorization. Simpan di server, jangan di kode frontend atau aplikasi mobile.",
  loading: "Memuat key",
  create: "Buat key",
  createTitle: "Key baru",
  createSub: "Beri nama sesuai tempat key dipakai, supaya mudah dicabut nanti.",
  name: "Nama key",
  namePlaceholder: "Contoh: Produksi",
  nameHint: "Maksimal 40 karakter.",
  budget: "Batas bulanan (USD)",
  budgetHint: "Opsional. Request ditolak setelah batas tercapai.",
  save: "Buat key",
  cancel: "Batal",
  nameRequired: "Isi nama key.",
  budgetInvalid: "Tulis angka dolar, misalnya 50 atau 49.99.",
  budgetTooHigh: `Maksimal ${formatMicros(MAX_BUDGET_MICROS)}.`,
  newKeyTitle: "Salin key ini sekarang",
  newKeyBody: "Key lengkap hanya ditampilkan sekali. Simpan di variabel lingkungan atau pengelola rahasia di server Anda.",
  keyBlock: "API key",
  envBlock: "Shell",
  done: "Selesai",
  notCopied: "Key belum disalin dan tidak bisa dilihat lagi. Tutup?",
  back: "Kembali",
  closeAnyway: "Tutup",
  list: "Key aktif",
  count: (n: number) => `${n} dari ${MAX_ACTIVE_KEYS} key`,
  limitNote: `Sudah ${MAX_ACTIVE_KEYS} key aktif. Cabut satu key untuk membuat yang baru.`,
  cols: { name: "Nama", key: "Key", created: "Dibuat", lastUsed: "Terakhir dipakai", budget: "Pemakaian bulan ini", actions: "Aksi" },
  never: "Belum pernah",
  noLimit: "Tanpa batas",
  near: "Hampir habis",
  reached: "Batas tercapai, request ditolak",
  resetNote: "Pemakaian dihitung sejak tanggal 1 pukul 00.00 UTC (07.00 WIB).",
  revoke: "Cabut",
  confirmRevoke: "Cabut key ini?",
  confirm: "Ya, cabut",
  revoked: "Key dicabut.",
  empty: {
    title: "Belum ada key aktif",
    body: "Buat key pertama untuk mulai mengirim request. Satu key bisa memanggil semua model.",
  },
};

/** Message for a failed create or revoke; unauthorized never shows, it sends the user to the login page. */
export function apiKeyErrorText(error: ApiKeyError): string {
  if (error.kind === "key_limit_reached") return apiKeysCopy.limitNote;
  if (error.kind === "offline") return "Anda sedang offline. Periksa koneksi lalu coba lagi.";
  return "Belum bisa menyimpan. Coba lagi.";
}
