// Text of the admin Models & pricing page (PRD gateway-pricing-billing §7.1, D4; gateway-api §15a).
import type { ModelPriceError } from "@/lib/model-price-client";

export const modelsCopy = {
  title: "Models & pricing",
  sub: "Pilih model dari katalog Surplus untuk dijual di nbytes. Harga jual = harga list × (1 + markup), dibulatkan ke atas.",
  loading: "Memuat model dan katalog Surplus",
  perM: "Harga dalam USD per 1 juta token.",
  curated: {
    title: "Model di nbytes",
    count: (on: number, total: number) => `${on} aktif dari ${total} model. Hanya model aktif yang bisa dipanggil pengguna.`,
    cols: { model: "Model", markup: "Markup", input: "Input / 1M", output: "Output / 1M", status: "Status", action: "Aksi" },
    listPrice: (list: string) => `list Surplus ${list}`,
    markupLabel: (model: string) => `Markup ${model} dalam persen`,
    invalid: "Isi persen 0 sampai 300, contoh 10 atau 12,5.",
    on: "Aktif",
    off: "Nonaktif",
    enable: "Aktifkan",
    disable: "Nonaktifkan",
    listChanged: "Harga list berubah",
    listChangedHint: (now: string) => `Harga list Surplus sekarang ${now}. Simpan markup lagi untuk memakai harga baru.`,
    gone: "Tidak ada di katalog",
    goneHint: (n: number) => `${n} model aktif tidak ada lagi di katalog Surplus. Pengguna mendapat error saat memanggilnya sampai model dinonaktifkan.`,
    empty: {
      title: "Belum ada model yang dijual",
      body: "Tambahkan model dari katalog Surplus di bawah. Pengguna hanya bisa memanggil model yang ada di sini.",
    },
  },
  surplus: {
    title: "Katalog Surplus",
    source: "Dibaca langsung dari Surplus setiap halaman dibuka.",
    count: (shown: number, total: number) => `${shown} dari ${total} model teks`,
    search: "Cari model",
    searchPlaceholder: "Nama, id, atau penyedia",
    filterLabel: "Tampilkan",
    filters: { all: "Semua", open: "Belum dipilih" },
    cols: {
      model: "Model", provider: "Penyedia", input: "Input / 1M", output: "Output / 1M", context: "Konteks", images: "Gambar", action: "Aksi",
    },
    yes: "Ya",
    add: "Tambah",
    addLabel: (model: string) => `Tambah ${model} dengan markup 0%`,
    added: "Sudah dipilih",
    zero: "Harga 0",
    zeroHint: "Harga list 0 di katalog. Belum diketahui apakah Surplus tetap menagih nbytes, jadi model ini belum bisa dijual.",
    more: (n: number) => `Tampilkan ${n} lagi`,
    none: "Tidak ada model yang cocok",
    noneBody: "Coba nama, id, atau penyedia lain, atau tampilkan Semua.",
    reset: "Hapus pencarian dan saringan",
    failed: {
      title: "Katalog Surplus tidak bisa dibaca",
      body: "Model yang sudah dipilih tetap jalan. Tekan Muat ulang sebentar lagi untuk menambah model.",
      reload: "Muat ulang",
    },
    note: "Hanya model teks yang ditampilkan: endpoint gambar, audio, video dan embeddings belum dibangun.",
  },
  clearSearch: "Hapus pencarian",
  saving: "Menyimpan…",
  saved: {
    markup: "markup disimpan; harga jual di tabel sudah diperbarui.",
    enabled: "diaktifkan; pengguna bisa memanggil model ini lagi.",
    disabled: "dinonaktifkan; pengguna tidak bisa memanggilnya dan model hilang dari halaman Models.",
    added: "ditambahkan dengan markup 0% dan langsung aktif.",
  },
  deactivate: {
    title: "Nonaktifkan model ini?",
    body: (model: string) =>
      `${model} langsung tidak bisa dipanggil: API menjawab 404 model_not_found dan model hilang dari halaman Models ` +
      "pengguna. Markup tetap tersimpan, jadi model bisa diaktifkan lagi kapan saja.",
    cancel: "Batal",
    confirm: "Ya, nonaktifkan",
  },
};

export const modelPriceErrorText: Record<Exclude<ModelPriceError, "unauthorized">, string> = {
  offline: "Tidak ada koneksi internet. Coba lagi setelah tersambung.",
  invalid_input: modelsCopy.curated.invalid,
  model_not_found: "Model tidak ada di katalog Surplus. Muat ulang halaman.",
  blocked: "Harga list model ini 0, jadi belum bisa dijual.",
  unavailable: "Gagal menyimpan. Surplus atau server sedang bermasalah, coba lagi.",
};
