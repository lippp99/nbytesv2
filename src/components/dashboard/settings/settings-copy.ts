import type { UserAuthError } from "@/lib/auth/auth-client";

// Text of the Account Settings page (shared/common-copy.ts holds the labels every page uses).
export const settings = {
  title: "Account Settings",
  sub: "Profil dan keamanan akun Anda.",
  loading: "Memuat pengaturan akun",
  profile: { title: "Profil", body: "Nama Anda tampil di dashboard dan email dari nbytes." },
  firstName: "Nama depan",
  firstPlaceholder: "John",
  firstInvalid: "Masukkan nama depan (huruf saja).",
  lastName: "Nama belakang",
  lastPlaceholder: "Doe",
  lastInvalid: "Nama belakang hanya boleh berisi huruf.",
  optional: "Opsional",
  email: "Email",
  emailNote: "Email dipakai untuk masuk dengan kode. Hubungi kami untuk menggantinya.",
  save: "Simpan perubahan",
  saving: "Menyimpan…",
  saved: "Perubahan tersimpan.",
  failed: "Belum bisa diproses. Coba lagi sebentar lagi.",
  offline: "Tidak ada koneksi internet.",
  rateLimited: (minutes: number) => `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`,
  security: { title: "Keamanan", body: "Perangkat yang sedang masuk ke akun Anda." },
  sessionsLink: "Lihat perangkat aktif",
  sessionsNote: "Keluarkan perangkat yang tidak Anda kenali.",
  danger: { title: "Hapus akun", body: "Akun dan semua sesi login Anda dihapus permanen. Tindakan ini tidak bisa dibatalkan." },
  deleteNote: "Kami akan meminta konfirmasi dan kode dari email Anda.",
  deleteAccount: "Hapus akun",
  deleteDialog: {
    title: "Hapus akun secara permanen?",
    body: "Akun, nama, dan sesi login di semua perangkat akan dihapus. Tindakan ini tidak bisa dibatalkan.",
    phraseLabel: 'Ketik "hapus akun" untuk melanjutkan',
    phraseMismatch: 'Ketik "hapus akun" persis seperti di atas.',
    sendCode: "Kirim kode ke email",
    sending: "Mengirim…",
    codeBody: (maskedEmail: string) => `Kami mengirim kode 8 digit ke ${maskedEmail}. Masukkan kode itu untuk menghapus akun.`,
    codeLabel: "Kode verifikasi",
    codeHint: "Berlaku 10 menit.",
    codeIncomplete: "Masukkan 8 digit kode.",
    codeInvalid: (left: number) => `Kode salah. Sisa ${left} percobaan.`,
    codeExpired: "Kode tidak berlaku lagi. Kirim ulang kode.",
    blocked: "Akun belum bisa dihapus selama ada deposit yang menunggu pembayaran atau saldo minus.",
    resend: "Kirim ulang kode",
    resent: "Kode baru sudah dikirim.",
    confirm: "Hapus akun permanen",
    deleting: "Menghapus…",
    cancel: "Batal",
  },
};

/** Error text shared by the profile form and the delete dialog (the server never sends text). */
export function errorText(error: UserAuthError): string {
  if (error.kind === "offline") return settings.offline;
  if (error.kind === "rate_limited") return settings.rateLimited(error.retryAfterMinutes);
  return settings.failed;
}
