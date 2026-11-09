import type { UserAuthError } from "@/lib/auth/auth-client";

// All login UI text in one place (PRD §5, language still open in §12).
export const authCopy = {
  pageTitle: "Login",
  tabs: { login: "Masuk", register: "Daftar" },
  title: { login: "Masuk ke nbytes", register: "Buat akun nbytes" },
  sub: {
    login: "Masuk untuk memakai semua model AI dengan satu API key.",
    register: "Buat akun untuk memakai semua model AI dengan satu API key.",
  },
  names: {
    firstLabel: "Nama depan",
    firstPlaceholder: "John",
    lastLabel: "Nama belakang",
    lastOptional: "(opsional)",
    lastPlaceholder: "Doe",
    firstInvalid: "Masukkan nama depan (huruf saja).",
    lastInvalid: "Nama belakang hanya boleh berisi huruf.",
  },
  email: {
    label: "Email",
    placeholder: "nama@perusahaan.com",
    sending: "Mengirim…",
    termsBefore: "Dengan melanjutkan, Anda setuju dengan",
    terms: "Ketentuan",
    and: "dan",
    privacy: "Privasi",
    invalid: "Masukkan alamat email yang valid.",
    hint: "Kami kirim kode 8 digit ke email Anda. Tanpa password.",
    submit: "Lanjut dengan email",
  },
  otp: {
    title: "Cek email Anda",
    subBefore: "Masukkan kode 8 digit yang kami kirim ke",
    changeEmail: "Ganti email",
    srLabel: "Kode verifikasi 8 digit",
    submit: "Verifikasi",
    verifying: "Memeriksa…",
    resend: "Kirim ulang kode",
    resendIn: "Kirim ulang dalam",
    incomplete: "Masukkan 8 digit kode.",
    success: "Berhasil login.",
  },
};

export function authErrorMessage(error: UserAuthError): string {
  switch (error.kind) {
    case "offline":
      return "Tidak ada koneksi internet.";
    case "unavailable":
      return "Kode belum bisa dikirim. Coba lagi sebentar lagi.";
    case "invalid_input":
      return authCopy.email.invalid;
    case "unauthorized":
      return "Sesi Anda sudah berakhir. Silakan masuk lagi.";
    case "rate_limited":
      return `Terlalu banyak percobaan. Coba lagi dalam ${error.retryAfterMinutes} menit.`;
    case "invalid":
      return `Kode salah. Sisa ${error.attemptsLeft} percobaan.`;
    case "expired":
      return "Kode tidak berlaku lagi. Minta kode baru.";
  }
}

/** 60 -> "1:00", 59 -> "0:59" */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
