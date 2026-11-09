import type { BadgeTone } from "@/components/app-kit/badge";
import type { UserStatus } from "./users-data";

// Text of the admin Users page.
export const usersCopy = {
  title: "Pengguna",
  sub: "Semua akun, paket, saldo dan pemakaian bulan ini.",
  search: "Cari pengguna",
  searchPlaceholder: "Cari nama atau email",
  cols: { user: "Pengguna", plan: "Paket", balance: "Saldo", spent: "Pemakaian bulan ini", status: "Status", joined: "Daftar", action: "Aksi" },
  suspend: "Tangguhkan",
  restore: "Aktifkan",
  empty: "Tidak ada yang cocok",
  emptyBody: "Coba nama atau email lain, atau kosongkan pencarian.",
  count: (shown: number, total: number) => `${shown} dari ${total} akun`,
  // shortcut: suspending only changes this page's state; the real action needs the admin API and an audit entry
  note: "Mode demo: perubahan tidak disimpan dan belum tercatat di audit log.",
};

export const userStatusBadge: Record<UserStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: "success", label: "Aktif" },
  suspended: { tone: "danger", label: "Ditangguhkan" },
  pending: { tone: "warning", label: "Belum verifikasi" },
};
