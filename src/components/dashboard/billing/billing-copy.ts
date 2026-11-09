// Text of the Billing page (shared/common-copy.ts holds the labels every page uses).
export const billing = {
  title: "Billing",
  sub: "Tagihan dihitung per token setiap bulan dan dibayar di akhir periode.",
  current: "Tagihan berjalan",
  periodEnds: (period: string) => `Periode ${period}, ditagih di akhir bulan`,
  budget: "Batas bulanan",
  used: (pct: number) => `${pct}% terpakai`,
  seeUsage: "Lihat rincian di Usage",
  plan: "Paket",
  payment: "Metode pembayaran",
  noPayment: "Belum ada",
  addPayment: "Tambah metode pembayaran",
  paymentLater: "Tersedia setelah backend pembayaran tersambung.",
  history: "Riwayat tagihan",
  historySub: "Tagihan per bulan, termasuk periode berjalan.",
  cols: { id: "Nomor", period: "Periode", amount: "Jumlah", status: "Status" },
  status: { paid: "Lunas", open: "Berjalan" },
};
