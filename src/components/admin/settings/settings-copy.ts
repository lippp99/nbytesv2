import type { SettingsFieldError } from "@/lib/platform/platform-settings-contract";

// Text of the admin platform settings page (owner decisions 2026-11-12). Every hint says what the switch really does.
export const settingsCopy = {
  title: "Pengaturan",
  sub: "Aturan yang berlaku untuk semua pengguna. Setiap simpan tercatat di audit log.",
  loading: "Memuat pengaturan",
  access: { title: "Akses", body: "Siapa yang boleh mendaftar, dan kapan API ditutup sementara." },
  signup: "Izinkan pendaftaran baru",
  signupHint: "Saat mati, email baru tidak bisa membuat akun. Akun yang sudah ada tetap bisa masuk.",
  maintenance: "Mode maintenance",
  maintenanceHint: "API /v1 dan Playground menjawab 503. Dashboard tetap terbuka (saldo, API key, billing) dengan banner di atas.",
  banner: "Teks banner",
  bannerHint: "Tampil di atas setiap halaman dashboard pengguna. Wajib saat maintenance nyala, maksimal 140 karakter.",
  bannerPlaceholder: "Contoh: Pemeliharaan terjadwal 02:00–03:00 UTC.",
  limits: { title: "Batas API", body: "Berlaku untuk semua key, termasuk yang sudah ada, mulai request berikutnya." },
  rpm: "Request per menit per key",
  rpmHint: "Angka bulat 1–10.000. Lewat dari itu dijawab 429. Halaman API Docs ikut menampilkan angka ini.",
  session: { title: "Sesi admin", body: "Berapa lama admin tetap masuk sebelum harus login ulang dengan kode email dan TOTP." },
  sessionLength: "Durasi sesi",
  sessionHint: "Berlaku mulai login admin berikutnya. Keluar otomatis setelah 30 menit tidak aktif tetap berlaku.",
  hours: (h: number) => `${h} jam`,
  save: "Simpan pengaturan",
  saving: "Menyimpan…",
  saved: "Pengaturan tersimpan dan langsung berlaku.",
  failed: "Pengaturan belum tersimpan. Coba lagi sebentar lagi.",
  offline: "Tidak ada koneksi internet.",
  confirmMaintenance: "Maintenance langsung menutup API dan Playground untuk semua pengguna. Lanjutkan?",
  confirmYes: "Ya, nyalakan maintenance",
  cancel: "Batal",
};

export const fieldErrorText: Record<SettingsFieldError, string> = {
  bannerRequired: "Isi teks banner saat maintenance nyala.",
  bannerTooLong: "Teks banner maksimal 140 karakter.",
  rpmInvalid: "Masukkan angka bulat 1–10.000.",
};
