// Text of the Models page (shared/common-copy.ts holds the labels every page uses).
export const modelsCopy = {
  title: "Models",
  sub: "Semua model yang bisa dipanggil dengan satu key. Harga dalam USD per 1 juta token.",
  search: "Cari model",
  searchPlaceholder: "Cari nama atau id model",
  provider: "Provider",
  allProviders: "Semua provider",
  count: (shown: number, total: number) => (shown === total ? `${total} model` : `${shown} dari ${total} model`),
  cols: { model: "Model", provider: "Provider", context: "Konteks", input: "Input", output: "Output", features: "Fitur" },
  empty: {
    title: "Tidak ada model yang cocok",
    body: "Coba kata lain, atau tampilkan semua provider.",
    reset: "Reset filter",
  },
};
