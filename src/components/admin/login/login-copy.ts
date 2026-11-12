import type { AdminError } from "@/lib/admin-auth/admin-auth-client";

// Text of the admin sign-in (PRD backend-auth-admin A.2–A.4). Layout: owner picked design B (card with stepper), 2026-11-08.
export const loginCopy = {
  pageTitle: "Masuk admin",
  brand: "nbytes Admin",
  stepper: {
    label: "Langkah masuk",
    steps: ["Email", "Kode email", "Authenticator"],
    done: "Selesai",
    current: "Sekarang",
    next: "Berikutnya",
  },
  lockNote: "Dua faktor wajib untuk semua admin",
  email: {
    title: "Masuk ke konsol admin",
    sub: "Khusus tim internal. Mulai dengan email kerja Anda.",
    label: "Email kerja",
    placeholder: "nama@nbytes.example",
    hint: "Bila email terdaftar sebagai admin, kami kirim kode 10 digit.",
    submit: "Kirim kode",
    sending: "Mengirim…",
    invalid: "Masukkan alamat email yang valid.",
  },
  code: {
    title: "Cek email Anda",
    sub: "Kode 10 digit dikirim ke",
    srLabel: "Kode email 10 digit",
    incomplete: "Masukkan 10 digit kode.",
    submit: "Lanjut",
    noCode: "Tidak menerima kode?",
    resend: "Kirim ulang",
    resendIn: "Kirim ulang dalam",
    back: "Ganti email",
  },
  totp: {
    title: "Kode authenticator",
    sub: "Buka aplikasi authenticator di HP Anda, lalu masukkan 6 digit untuk nbytes Admin.",
    srLabel: "Kode authenticator 6 digit",
    incomplete: "Masukkan 6 digit kode.",
    submit: "Masuk",
    back: "Mulai lagi",
    invalid: (left: number) => `Kode authenticator salah. Sisa ${left} percobaan.`,
  },
  useBackup: "Pakai kode cadangan",
  backup: {
    title: "Kode cadangan",
    sub: "Masukkan salah satu kode cadangan yang Anda simpan saat mengatur authenticator. Setiap kode hanya berlaku sekali.",
    label: "Kode cadangan",
    placeholder: "ABCDE-FGHJK",
    incomplete: "Masukkan kode cadangan 10 karakter.",
    submit: "Masuk",
    invalid: (left: number) => `Kode cadangan salah. Sisa ${left} percobaan.`,
    useTotp: "Pakai kode authenticator",
  },
  enroll: {
    title: "Atur authenticator",
    sub: "Pindai QR dengan aplikasi authenticator, lalu masukkan 6 digit yang muncul untuk nbytes Admin.",
    qrTitle: "QR code untuk aplikasi authenticator",
    secretLabel: "Atau masukkan kunci ini secara manual",
    openApp: "Buka di aplikasi authenticator",
    loading: "Menyiapkan kunci…",
    failed: "Kunci belum bisa dibuat.",
    retry: "Coba lagi",
    submit: "Aktifkan dan masuk",
  },
  codes: {
    title: "Simpan kode cadangan",
    sub: "Pakai salah satu kode ini bila HP Anda hilang. Setiap kode hanya berlaku sekali, dan daftar ini hanya ditampilkan sekarang.",
    listLabel: "10 kode cadangan",
    copy: "Salin semua",
    copied: "Tersalin",
    download: "Unduh .txt",
    fileName: "nbytes-admin-kode-cadangan.txt",
    done: "Saya sudah menyimpan, lanjut",
  },
  verifying: "Memeriksa…",
  success: "Berhasil masuk.",
  restart: "Percobaan habis. Mulai lagi dari email.",
};

export function loginErrorMessage(error: AdminError): string {
  switch (error.kind) {
    case "offline":
      return "Tidak ada koneksi internet.";
    case "unavailable":
      return "Kode belum bisa dikirim. Coba lagi sebentar lagi.";
    case "rate_limited":
      return `Terlalu banyak percobaan. Coba lagi dalam ${error.retryAfterMinutes} menit.`;
    case "invalid":
      return `Kode salah. Sisa ${error.attemptsLeft} percobaan.`;
    case "expired":
      return "Kode tidak berlaku lagi. Minta kode baru.";
    default:
      return "Permintaan belum bisa diproses. Coba lagi sebentar lagi.";
  }
}
