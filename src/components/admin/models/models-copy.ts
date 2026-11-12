// Text of the admin Models & pricing page (PRD gateway-pricing-billing §7.1, D4; gateway-api §15a).
import type { ModelPriceError } from "@/lib/model-price-client";

export const modelsCopy = {
  title: "Model & harga",
  sub: "Pilih model dari katalog Surplus untuk dijual di nbytes. Harga jual = harga list × (1 + markup), dibulatkan ke atas.",
  loading: "Memuat model dan katalog Surplus",
  perM: "Harga dalam USD per 1 juta token.",
  curated: {
    title: "Model di nbytes",
    count: (on: number, total: number) => `${on} aktif dari ${total} model. Hanya model aktif yang bisa dipanggil pengguna.`,
    cols: {
      model: "Model", list: "Harga list / 1M token", sell: "Harga jual / 1M token", input: "Input", output: "Output", markup: "Markup",
      status: "Status",
    },
    markupLabel: (model: string) => `Markup ${model} dalam persen`,
    invalid: "Isi persen 0 sampai 300, contoh 10 atau 12,5.",
    on: "Aktif",
    off: "Nonaktif",
    enable: "Aktifkan",
    disable: "Nonaktifkan",
    listChanged: "Harga list berubah",
    listChangedHint: (now: string) => `Harga list Surplus sekarang ${now}. Simpan markup lagi untuk memakai harga baru.`,
    gone: "Tidak ada di katalog",
    goneHint: "Model ini tidak ada lagi di katalog Surplus. Pengguna akan mendapat error sampai model dinonaktifkan.",
    empty: {
      title: "Belum ada model yang dijual",
      body: "Tambahkan model dari katalog Surplus di bawah. Pengguna hanya bisa memanggil model yang ada di sini.",
    },
  },
  surplus: {
    title: "Katalog Surplus",
    count: (shown: number, total: number) => `${shown} dari ${total} model teks, dibaca langsung dari Surplus.`,
    search: "Cari model",
    searchPlaceholder: "Nama, id, atau penyedia",
    filterLabel: "Tampilkan",
    filters: { all: "Semua", open: "Belum dipilih" },
    cols: {
      model: "Model", provider: "Penyedia", input: "Input / 1M token", output: "Output / 1M token", context: "Konteks", images: "Gambar", action: "Aksi",
    },
    yes: "Ya",
    add: "Tambah",
    addLabel: (model: string) => `Tambah ${model} dengan markup 0%`,
    added: "Sudah dipilih",
    zero: "Harga 0",
    zeroHint: "Harga list 0 di katalog. Belum diketahui apakah Surplus tetap menagih nbytes, jadi model ini belum bisa dijual.",
    more: (n: number) => `Tampilkan ${n} lagi`,
    none: "Tidak ada model yang cocok dengan pencarian.",
    failed: {
      title: "Katalog Surplus tidak bisa dibaca",
      body: "Model yang sudah dipilih tetap jalan. Muat ulang halaman sebentar lagi untuk menambah model.",
    },
    note: "Hanya model teks yang ditampilkan: endpoint gambar, audio, video dan embeddings belum dibangun.",
  },
  saved: "Tersimpan.",
};

export const modelPriceErrorText: Record<Exclude<ModelPriceError, "unauthorized">, string> = {
  offline: "Tidak ada koneksi internet. Coba lagi setelah tersambung.",
  invalid_input: modelsCopy.curated.invalid,
  model_not_found: "Model tidak ada di katalog Surplus. Muat ulang halaman.",
  blocked: "Harga list model ini 0, jadi belum bisa dijual.",
  unavailable: "Gagal menyimpan. Surplus atau server sedang bermasalah, coba lagi.",
};
