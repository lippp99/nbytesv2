// Text of the admin Models & pricing page (PRD admin-console §3.2).
export const modelsCopy = {
  title: "Model & harga",
  sub: "Atur margin per model. Harga jual = biaya upstream + markup, dibulatkan ke atas ke sen terdekat per 1 juta token.",
  rules: {
    title: "Aturan margin",
    description: "Berlaku untuk semua model, bisa diganti per model di tabel.",
    markup: "Markup default",
    markupHint: "Persen di atas biaya upstream, 0–300.",
    apply: "Terapkan ke semua model",
    applied: (n: number) => `Markup diterapkan ke ${n} model.`,
    topUp: "Biaya top-up",
    topUpHint: "Dipotong dari setiap pembelian saldo. Menutup biaya kartu dan memberi margin tambahan.",
    invalid: "Masukkan persen 0–300, contoh 12 atau 12,5.",
  },
  sources: {
    title: "Dari mana margin datang",
    items: [
      { name: "Markup token", body: "Selisih harga jual dan biaya upstream di setiap request. Sumber utama." },
      { name: "Biaya top-up", body: "Persen kecil di setiap pembelian saldo, sebelum dipotong biaya kartu." },
      { name: "Diskon provider", body: "Harga upstream turun karena volume besar, sementara harga jual tetap." },
      { name: "Paket bulanan", body: "Biaya langganan Pro/Tim di luar pemakaian token." },
    ],
    note: "Markup ≠ margin: markup 10% di atas biaya = margin 9.1% dari harga jual.",
  },
  table: {
    title: "Harga per model",
    count: (on: number, total: number) => `${on} dari ${total} model aktif`,
    cols: { model: "Model", cost: "Biaya upstream / 1M", sell: "Harga jual / 1M", markup: "Markup", margin: "Margin", status: "Status" },
    inOut: "harga input · output; markup dan margin dibaca dari harga output",
    markupLabel: (model: string) => `Markup ${model} dalam persen`,
    on: "Aktif",
    off: "Nonaktif",
    disable: "Nonaktifkan",
    enable: "Aktifkan",
    custom: "diubah",
  },
  example: {
    title: "Contoh hitungan satu request",
    description: "2.000 token input dan 500 token output, memakai markup saat ini.",
    model: "Model",
    rows: { cost: "Biaya ke provider", revenue: "Dibayar pengguna", profit: "Laba kotor", margin: "Margin" },
    topUpTitle: "Contoh top-up $100",
    topUpRows: { fee: "Biaya top-up", card: "Biaya kartu", net: "Sisa untuk nbytes" },
  },
  // shortcut: nothing is saved; the real change needs the admin API, an audit entry and a price-change notice
  note: "Mode demo: harga baru belum dikirim ke katalog dan belum tercatat di audit log.",
};
