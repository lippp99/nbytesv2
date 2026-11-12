// Text of the Models page (shared/common-copy.ts holds the labels every page uses).
export const modelsCopy = {
  title: "Models",
  sub: "Semua model yang bisa dipanggil dengan satu key. Harga dalam USD per 1 juta token.",
  loading: "Memuat model",
  search: "Cari model",
  searchPlaceholder: "Cari nama atau id model",
  count: (shown: number, total: number) => (shown === total ? `${total} model` : `${shown} dari ${total} model`),
  cols: { model: "Model", context: "Konteks", maxOutput: "Maks output", input: "Input / 1M", output: "Output / 1M", features: "Fitur" },
  sortBy: (column: string) => `Urutkan ${column} dari yang termurah`,
  sortReset: (column: string) => `Diurutkan ${column} termurah. Klik untuk kembali urut nama`,
  images: "Input gambar",
  empty: {
    title: "Tidak ada model yang cocok",
    body: "Coba kata lain atau id model yang lain.",
    reset: "Reset filter",
  },
  noModels: {
    title: "Belum ada model yang tersedia",
    body: "Hubungi admin.",
  },
};
