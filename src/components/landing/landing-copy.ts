// All landing UI text in one place, so the language and product name (PRD §12, still open) are easy to swap.

export const nav = [
  { href: "#model", label: "Model" },
  { href: "#agen", label: "Agen coding" },
  { href: "#fitur", label: "Fitur" },
  { href: "#faq", label: "FAQ" },
];

export const actions = {
  signIn: "Masuk",
  getKey: "Dapatkan API key",
  seeModels: "Lihat model",
  menu: "Buka menu",
};

export const hero = {
  pill: "Sekarang tersedia: GPT-5, Claude Sonnet 4.5, Gemini 2.5 Pro",
  titleLine1: "Satu key untuk",
  /** The highlighted word rotates through these; the first one is the static/SSR text. */
  rotating: ["semua model", "agen coding", "chatbot Anda", "produk Anda"],
  lead: "Ganti base URL, pakai satu API key, lalu panggil model dari sepuluh provider. Token dan biaya tiap request tercatat di satu tempat.",
  strip: { label: "Tersedia di semua paket", more: "+9 model lain" },
};

export const chart = {
  title: "Harga per 1M token",
  unit: "(USD, skala log)",
  input: "Input",
  output: "Output",
  cheaper: "Lebih murah",
  label: "Grafik harga input dan output per 1M token untuk delapan model (data contoh)",
  prev: "Model sebelumnya",
  next: "Model berikutnya",
  pause: "Jeda",
  play: "Putar",
  perM: "/ 1M",
  upTo: "hingga",
  stats: { input: "Input", output: "Output", context: "Konteks" },
  sub: { via: "via", ratio: "× harga input", context: "token per request" },
  note: "Harga per 1M token untuk setiap model, input dan output. Data contoh untuk tampilan; harga resmi diumumkan saat peluncuran.",
};

export const dashboard = {
  nav: [
    { label: "Model", count: "12" },
    { label: "Log", active: true },
    { label: "Key", count: "3" },
    { label: "Anggaran" },
    { label: "Privasi" },
  ],
  navBottom: ["Docs", "Pengaturan"],
  org: { name: "Tim Anda", plan: "Paket Pro" },
  title: "Log",
  sub: "Setiap request lewat gateway, lengkap dengan biaya dan hasilnya.",
  ranges: ["24 jam", "7 hari", "30 hari"],
  usage: { title: "Pemakaian", requests: "Request", cost: "Biaya", total: "Total" },
  history: { title: "Riwayat request", live: "Live", time: "Waktu", status: "Status", model: "Model", tag: "Tag", cost: "Biaya" },
  label: "Contoh dasbor nbytes dengan data contoh",
};

export const models = {
  titleBefore: "Pustaka",
  titleMark: "model",
  lead: "Harga input dan output, konteks, dan kemampuan tiap model di satu daftar. Semua angka di sini adalah contoh.",
  search: "Cari model, ID, atau kemampuan",
  count: "model",
  capsLabel: "Kemampuan",
  empty: "Tidak ada model yang cocok.",
  // short labels: the long "per 1M token output" wrapped to two lines in the 104px price column
  perInput: "input / 1M",
  perOutput: "output / 1M",
  context: "konteks",
  showAll: (n: number) => `Tampilkan semua ${n} model`,
  showLess: "Tampilkan lebih sedikit",
  kind: "Chat",
};

export const agents = {
  titleBefore: "Hubungkan agen",
  titleMark: "coding",
  titleAfter: " Anda",
  lead: "Pilih model, lalu tool Anda. Konfigurasi di bawah sudah memuat keduanya.",
  seeModels: "Lihat model",
  modelLabel: "Model",
  pickLabel: "Model untuk konfigurasi",
  toolLabel: "Tool",
  setupIn: "Atur di",
  copySetup: "Salin konfigurasi",
  copy: "Salin",
  copied: "Tersalin",
  step1: "Masuk dan buat API key di dasbor.",
  step3: (tool: string, model: string) => `Buka ${tool} dan kirim request ke ${model}.`,
  hub: "Model nbytes",
  responsesOnly: "Codex memakai Responses API, yang hanya dijawab model OpenAI",
};

export const features = {
  titleBefore: "Dibuat untuk AI di",
  titleMark: "produk",
  titleAfter: " Anda.",
  tags: {
    title: "Biaya per pelanggan",
    body: "Beri tag di setiap request, lalu lihat pemakaian tiap akun pelanggan Anda.",
    cols: { customer: "Pelanggan", requests: "Request", cost: "Biaya" },
  },
  fallback: {
    title: "Produk Anda tetap jalan",
    body: "Saat provider membalas batas rate atau gangguan, request pindah ke provider berikutnya sesuai urutan Anda.",
    result: "Pengguna Anda tetap dapat jawaban dari openai.",
  },
  budget: { title: "Batas anggaran per key", body: "Tentukan batas bulanan. Request ditolak setelah batas tercapai.", of: "dari" },
  oneKey: { title: "Satu key, sepuluh provider", body: "Tanpa akun dan tagihan terpisah di tiap provider." },
};

export const privacy = {
  titleBefore: "Isi prompt tidak kami",
  titleMark: "simpan",
  titleAfter: ".",
  lead: "Yang dicatat hanya jumlah token dan waktu untuk tagihan.",
  // Placeholder points (PRD §4.1 #5); confirm against the real backend before release.
  points: [
    { icon: "lock", title: "Terenkripsi di jalan", body: "HTTPS dari aplikasi Anda ke gateway, lalu ke provider." },
    { icon: "database", title: "Tanpa simpan prompt", body: "Kami mencatat token dan waktu, bukan teks yang Anda kirim atau terima." },
    { icon: "key", title: "Key bisa dicabut", body: "Key yang bocor dinonaktifkan tanpa mengganggu key lain." },
    { icon: "route", title: "Provider yang menjawab", body: "Request diteruskan ke provider model, di bawah ketentuan masing-masing." },
  ],
};

export const faq = {
  titleBefore: "Pertanyaan,",
  titleMark: "terjawab",
  more: "Ada hal lain? Tulis ke",
};

export const closing = {
  titleBefore: "Satu key untuk setiap",
  titleMark: "model",
  lead: "Masuk dengan email, buat key, dan panggil model pertama Anda lewat SDK OpenAI.",
  ask: "Mencari model lain?",
  askLink: "Minta di sini",
};

export const footer = {
  tagline: "AI gateway yang kompatibel dengan OpenAI.",
  groups: [
    { title: "Produk", links: [{ href: "#model", label: "Model" }, { href: "#fitur", label: "Fitur" }, { href: "#faq", label: "FAQ" }] },
    { title: "Developer", links: [{ href: "#agen", label: "Agen coding" }, { href: "/login", label: "Masuk" }] },
    // shortcut: legal pages do not exist yet; links point to "#" until they are written.
    { title: "Legal", links: [{ href: "#", label: "Ketentuan" }, { href: "#", label: "Privasi" }] },
  ],
  contact: "halo@example.com",
  skip: "Lewati ke konten",
};
