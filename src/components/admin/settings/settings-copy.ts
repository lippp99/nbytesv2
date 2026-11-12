// Text of the admin platform settings page.
export const settingsCopy = {
  title: "Pengaturan",
  sub: "Aturan yang berlaku untuk semua pengguna. Setiap perubahan tercatat di audit log.",
  access: { title: "Akses", body: "Siapa yang boleh mendaftar dan kapan platform ditutup sementara." },
  signup: "Izinkan pendaftaran baru",
  signupHint: "Saat mati, hanya akun yang sudah ada yang bisa masuk.",
  maintenance: "Mode maintenance",
  maintenanceHint: "API menjawab 503 dan dashboard menampilkan banner di bawah.",
  banner: "Teks banner",
  bannerPlaceholder: "Contoh: Pemeliharaan terjadwal 02:00–03:00 UTC.",
  bannerRequired: "Isi teks banner saat maintenance aktif.",
  limits: { title: "Batas default", body: "Berlaku untuk akun baru; bisa diubah per akun nanti." },
  rpm: "Request per menit",
  rpmHint: "Angka bulat 1–10.000.",
  rpmInvalid: "Masukkan angka bulat 1–10.000.",
  session: { title: "Sesi admin", body: "Berapa lama admin tetap masuk sebelum harus login ulang dengan kode email dan TOTP." },
  sessionLength: "Durasi sesi",
  sessionOptions: ["4 jam", "8 jam", "12 jam"],
  save: "Simpan",
  // shortcut: nothing is persisted until the admin API exists (PRD backend-auth-admin)
  saved: "Tersimpan (mode demo, tidak dikirim ke server).",
};
