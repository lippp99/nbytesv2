// Text of the admin Upstream page (PRD admin-requests-upstream §4). Replaces the old Provider page (R1, D5).
export const upstreamCopy = {
  title: "Upstream",
  sub: "Surplus Intelligence adalah satu-satunya upstream nbytes. Saldo nbytes di sana dan kesehatan model dari request nbytes sendiri.",
  loading: "Memuat data upstream",
  balance: {
    title: "Saldo nbytes di Surplus",
    description: "Dibaca langsung dari Surplus setiap halaman dibuka. Kalau habis, semua request pengguna gagal.",
    credit: "Saldo kredit",
    autoTopup: "Isi ulang otomatis",
    accountStatus: "Status akun Surplus",
    on: "Nyala",
    off: "Mati",
    unknown: "Tidak diketahui",
    failedTitle: "Saldo tidak bisa dibaca",
    failedBody: "Surplus tidak menjawab atau key Surplus belum diatur. Cek dashboard Surplus, lalu tekan Muat ulang.",
    reload: "Muat ulang",
  },
  attention: {
    title: "Perlu tindakan",
    description: (h: number) => `Request ${h} jam terakhir yang gagal karena key, kredit, atau batas belanja nbytes di Surplus, bukan salah pengguna.`,
    cols: { code: "Kode Surplus", status: "HTTP", count: "Jumlah", last: "Terakhir (UTC)" },
    unknownCode: "tidak ada kode",
    none: "Tidak ada kejadian. Semua kegagalan dalam periode ini, bila ada, berasal dari request pengguna atau dari model.",
  },
  models: {
    title: "Kesehatan per model",
    description: (h: number) => `Dari request nbytes ${h} jam terakhir. Model aktif tanpa request tetap ditampilkan.`,
    cols: {
      model: "Model", requests: "Request", failed: "Gagal", unavailable: "Tidak tersedia", latency: "Latensi p50",
      pending: "Biaya menunggu", negative: "Margin negatif",
    },
    inactive: "nonaktif",
    emptyTitle: "Belum ada data",
    emptyBody: "Tambahkan model di Model & harga. Setelah pengguna memanggilnya, kesehatannya muncul di sini.",
    note: "Tidak tersedia = Surplus tidak menemukan penjual, lantai diskon 25% tidak terpenuhi, atau tidak ada penjual sehat.",
  },
};
