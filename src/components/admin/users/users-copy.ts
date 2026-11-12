import type { BadgeTone } from "@/components/app-kit/badge";
import type { UserFilter, UserStatus } from "@/lib/admin-users/user-admin-contract";
import type { UserStatusError } from "@/lib/admin-users/user-admin-client";

// Text of the admin Users page (PRD admin-users-audit §3).
export const usersCopy = {
  title: "Pengguna",
  sub: "Semua akun, saldo, pemakaian bulan ini dan status. Akun yang ditangguhkan tidak bisa masuk dan key API-nya ditolak.",
  loading: "Memuat pengguna",
  search: "Cari pengguna",
  searchPlaceholder: "Cari nama atau email",
  searchSubmit: "Cari",
  filterLabel: "Status akun",
  count: (total: number) => `${total} akun`,
  cols: {
    user: "Pengguna", status: "Status", balance: "Saldo", spent: "Pemakaian bulan ini", keys: "Key aktif",
    lastLogin: "Login terakhir", joined: "Daftar", action: "Aksi",
  },
  held: (amount: string) => `${amount} ditahan`,
  never: "Belum pernah",
  empty: { title: "Belum ada pengguna", body: "Akun muncul di sini setelah orang mendaftar lewat halaman login." },
  noMatch: { title: "Tidak ada yang cocok", body: "Coba nama atau email lain, atau pilih status Semua.", reset: "Hapus pencarian dan saringan" },
  searching: "Mencari…",
  loadingResults: "Memuat hasil…",
  pagination: { nav: "Halaman daftar pengguna", pageOf: (p: number, n: number) => `Halaman ${p} dari ${n}`, previous: "Sebelumnya", next: "Berikutnya" },
  suspend: "Tangguhkan",
  restore: "Aktifkan",
  dialog: {
    suspendTitle: "Tangguhkan akun ini?",
    suspendBody: (email: string) =>
      `${email} akan keluar dari semua perangkat, tidak bisa masuk, dan semua key API-nya ditolak sampai akun diaktifkan lagi. ` +
      "Saldo dan key tidak dihapus.",
    reason: "Alasan",
    reasonHint: "Wajib, maksimal 200 karakter. Tersimpan di audit log.",
    reasonRequired: "Tulis alasan penangguhan.",
    reasonTooLong: "Alasan maksimal 200 karakter.",
    restoreTitle: "Aktifkan akun ini lagi?",
    restoreBody: (email: string) => `${email} bisa masuk lagi dan key API yang belum dicabut langsung berfungsi lagi.`,
    cancel: "Batal",
    confirmSuspend: "Ya, tangguhkan",
    confirmRestore: "Ya, aktifkan",
    saving: "Menyimpan…",
    suspended: (email: string) => `${email} ditangguhkan: keluar dari semua perangkat dan key API-nya ditolak.`,
    restored: (email: string) => `${email} aktif lagi: bisa masuk dan key API yang belum dicabut berfungsi.`,
  },
};

export const filterLabels: Record<UserFilter, string> = { all: "Semua", active: "Aktif", suspended: "Ditangguhkan" };

export const userStatusBadge: Record<UserStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: "success", label: "Aktif" },
  suspended: { tone: "danger", label: "Ditangguhkan" },
};

export const statusErrorText: Record<Exclude<UserStatusError, "unauthorized">, string> = {
  offline: "Tidak ada koneksi internet. Coba lagi setelah tersambung.",
  invalid_input: usersCopy.dialog.reasonRequired,
  not_found: "Akun ini sudah tidak ada. Muat ulang halaman.",
  unavailable: "Gagal menyimpan. Coba lagi sebentar lagi.",
};
