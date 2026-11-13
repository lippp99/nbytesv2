import type { UsageSort } from "@/lib/admin-gateway/usage-contract";

// Text of the admin Usage page. Figures come from gateway_requests; nothing here is an example.
export const usageCopy = {
  title: "Usage",
  sub: "Token dan tagihan semua pengguna per model dan per akun, untuk bulan, tahun, atau rentang tanggal pilihan. Waktu dalam UTC.",
  loading: "Memuat pemakaian",
  sortLabel: "Urutkan",
  summary: {
    tokensLabel: "Token periode ini",
    moneyLabel: "Uang dan akun periode ini",
    total: "Total token",
    input: "Token input",
    output: "Token output",
    requests: "Request",
    requestsNote: (failed: string) => `${failed} gagal`,
    charge: "Ditagih",
    cost: "Biaya Surplus",
    costNote: (pending: number) => (pending ? `${pending} request biayanya masih menunggu` : "semua biaya sudah diketahui"),
    margin: "Margin kotor",
    marginNote: (pct: string | null) => (pct ? `${pct} dari tagihan yang biayanya diketahui` : "belum ada tagihan dengan biaya diketahui"),
    accounts: "Pengguna aktif",
    accountsNote: (models: number) => `${models} model dipakai`,
    change: (pct: string, before: string) => `${pct} dibanding ${before}`,
    noPrevious: (before: string) => `${before} tidak ada data`,
  },
  chart: {
    title: (byMonth: boolean) => (byMonth ? "Token per bulan" : "Token per hari"),
    caption: (byMonth: boolean, period: string) => `Token input dan output per ${byMonth ? "bulan" : "hari"}, ${period}`,
    input: "Input",
    output: "Output",
    date: "Tanggal",
  },
  models: {
    title: (n: number) => `Per model (${n})`,
    pagination: { nav: "Halaman model", pageOf: (p: number, n: number) => `Halaman ${p} dari ${n}`, previous: "Sebelumnya", next: "Berikutnya" },
    description: "Semua model yang dipanggil di periode ini, dengan nama dari Models & pricing. Klik id model untuk melihat request-nya.",
  },
  users: {
    title: (n: number) => `Per pengguna (${n})`,
    description: "Akun yang memanggil API di periode ini. Klik email untuk melihat request-nya.",
    search: "Cari pengguna",
    searchPlaceholder: "Email",
    searchSubmit: "Cari",
    searching: "Mencari…",
    deleted: "Akun dihapus (gabungan)",
    noMatch: { title: "Tidak ada yang cocok", body: "Tidak ada akun dengan email itu yang memanggil API di periode ini.", reset: "Hapus pencarian" },
    pagination: { nav: "Halaman pengguna", pageOf: (p: number, n: number) => `Halaman ${p} dari ${n}`, previous: "Sebelumnya", next: "Berikutnya" },
  },
  cols: {
    model: "Model", user: "Pengguna", requests: "Request", failed: "Gagal", accounts: "Pengguna", models: "Model",
    input: "Token input", output: "Token output", total: "Total token", share: "Porsi token", charge: "Ditagih",
    cost: "Biaya Surplus", margin: "Margin",
  },
  empty: {
    title: (period: string) => `Belum ada request di ${period}`,
    body: "Pilih periode lain, atau tunggu sampai pengguna memanggil API dengan key mereka.",
  },
  costNote: "Biaya Surplus hanya dari request yang biayanya sudah diketahui; margin membandingkan request yang sama saja.",
};

export const sortLabels: Record<UsageSort, string> = { tokens: "Token", charge: "Tagihan", requests: "Request" };
