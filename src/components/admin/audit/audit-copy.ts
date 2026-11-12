import type { AuditFilter } from "@/lib/admin-auth/audit-contract";

// Text of the admin Audit log page (PRD admin-users-audit §4).
export const auditCopy = {
  title: "Audit log",
  sub: "Setiap aksi dan login admin tercatat di sini. Halaman ini hanya bisa dibaca; aplikasi tidak pernah mengubah atau menghapus barisnya.",
  loading: "Memuat audit log",
  filterLabel: "Jenis kejadian",
  loadingResults: "Memuat…",
  depositRules: (min: string, max: string, fee: string) => `Min ${min} · Maks ${max} · Biaya ${fee}%`,
  pages: { contact: "Halaman Kontak admin", settings: "Halaman Pengaturan" },
  copyId: "Salin id akun",
  copiedId: "Id tersalin",
  copyFailed: "Gagal menyalin. Pilih teksnya lalu salin manual.",
  count: (total: number) => `${total} kejadian`,
  cols: { at: "Waktu (UTC)", actor: "Admin", action: "Kejadian", target: "Target", reason: "Alasan", ip: "IP" },
  noAdmin: "Tidak dikenal",
  removed: "sudah dihapus",
  ipNote: "IP disamarkan (dua angka terakhir tidak disimpan). Baris lama dan baris tanpa header IP tepercaya tampil sebagai —.",
  empty: { title: "Belum ada kejadian", body: "Login admin dan setiap perubahan kurs, harga model atau status akun akan tercatat di sini." },
  emptyFiltered: { title: "Tidak ada kejadian jenis ini", body: "Pilih Semua untuk melihat seluruh riwayat." },
  pagination: { nav: "Halaman audit log", pageOf: (p: number, n: number) => `Halaman ${p} dari ${n}`, previous: "Sebelumnya", next: "Berikutnya" },
};

export const filterLabels: Record<AuditFilter, string> = { all: "Semua", login: "Login admin", actions: "Aksi admin" };

/** One sentence per audit type written by the code (audit.ts); an unknown type shows its raw name. */
export const actionLabels: Record<string, string> = {
  code_sent: "Kode login dikirim",
  code_send_failed: "Kode login gagal dikirim",
  code_failed: "Kode login salah",
  totp_failed: "Kode authenticator salah",
  login_success: "Login berhasil",
  logout: "Logout",
  totp_enrolled: "Authenticator didaftarkan",
  backup_code_used: "Kode cadangan dipakai",
  invited: "Akun Owner dibuat",
  locked: "Login dikunci sementara",
  exchange_rate_set: "Mengubah kurs",
  deposit_rules_set: "Mengubah batas dan biaya deposit",
  contact_set: "Mengubah kontak admin",
  settings_set: "Mengubah pengaturan platform",
  model_price_set: "Menambah atau mengubah harga model",
  model_disabled: "Menonaktifkan model",
  user_suspended: "Menangguhkan akun",
  user_restored: "Mengaktifkan akun",
};
