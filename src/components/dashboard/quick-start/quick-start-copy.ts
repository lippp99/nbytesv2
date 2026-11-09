// Text of the Quick start page.
export const quickStartCopy = {
  title: "Quick start",
  sub: (name: string) => `Halo ${name}. Endpoint nbytes mengikuti format OpenAI, jadi SDK yang sudah Anda pakai cukup diarahkan ke base URL baru.`,
  openDocs: "API Docs",
  createKey: "Buat API key",
  setup: "Langkah setup",
  progress: (done: number, total: number) => `${done} dari ${total} selesai`,
  done: "Selesai",
  steps: {
    account: { title: "Buat akun", body: (email: string) => `Masuk dengan kode email ke ${email}.` },
    key: { title: "Buat API key", body: "Simpan key di variabel NBYTES_API_KEY, di server, bukan di kode frontend.", action: "Kelola key" },
    request: { title: "Kirim request pertama", body: "Pilih model dan bahasa, salin kodenya, lalu jalankan di terminal atau aplikasi Anda." },
    monitor: {
      title: "Pantau biaya dan pasang batas",
      body: "Setiap request tercatat dengan token dan biayanya. Pasang batas bulanan per key sebelum rilis.",
      action: "Buka Usage",
    },
  },
  builder: {
    model: "Model",
    language: "Bahasa",
    pricing: "per 1 juta token",
    input: "input",
    output: "output",
    tryIt: "Coba di Playground",
  },
  connection: {
    title: "Koneksi",
    baseUrl: "Base URL",
    activeKeys: "API key aktif",
    models: "Model tersedia",
    manage: "Kelola",
    browse: "Lihat",
  },
  aside: {
    popular: "Model populer",
    perInput: "Input / 1M token",
    allModels: "Semua model",
    explore: "Jelajahi",
  },
  links: [
    { href: "/playground", title: "Playground", body: "Bandingkan jawaban model tanpa menulis kode." },
    { href: "/docs", title: "API Docs", body: "Endpoint, autentikasi, dan kode error." },
    { href: "/usage", title: "Usage", body: "Biaya per hari dan per model." },
  ],
};
