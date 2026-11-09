import type { AuthError } from "@/lib/auth/auth-client";

// Text of the admin sign-in (PRD admin-console §2). Layout: owner picked design B (card with stepper), 2026-11-08.
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
  verifying: "Memeriksa…",
  success: "Berhasil masuk.",
  demo: "Mode demo: kode",
  restart: "Percobaan habis. Mulai lagi dari email.",
};

export function loginErrorMessage(error: AuthError): string {
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
  }
}

/** 42 -> "0:42" */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
