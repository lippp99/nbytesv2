import type { AlertKind } from "@/lib/admin-overview-contract";

// Text of the admin overview (PRD admin-overview §3). Figures come from the database; nothing here is an example.
export const overviewCopy = {
  title: "Overview",
  sub: "Peringatan, saldo pengguna, 24 jam terakhir dan tren 30 hari. Angka uang per periode ada di Billing. Waktu dalam WIB.",
  loading: "Memuat ringkasan",
  day: {
    label: "Angka 24 jam dan pengguna",
    requests: "Request 24 jam",
    requestsNote: "semua endpoint",
    failed: "Gagal 24 jam",
    failedNote: (ours: number) => (ours ? `${ours} karena key atau kredit Surplus nbytes` : "tidak ada yang karena nbytes"),
    latency: "Latensi p50 24 jam",
    latencyNote: "dari request yang selesai",
    users: "Pengguna",
    usersNote: (active: number, fresh: number, suspended: number) =>
      `${active} aktif 30 hari · ${fresh} baru bulan ini · ${suspended} ditangguhkan`,
  },
  alerts: {
    title: "Peringatan",
    description: "Dihitung dari data saat ini. Hilang sendiri setelah penyebabnya beres.",
    none: "Tidak ada yang perlu ditindaklanjuti.",
  },
  money: {
    title: "Kesehatan uang",
    description: "Kredit nbytes di Surplus dibanding saldo prabayar yang masih bisa dipakai pengguna.",
    users: "Total saldo pengguna",
    usersHeld: (held: string) => `${held} sedang ditahan`,
    coverage: "Cakupan",
    coverageNote: "saldo Surplus ÷ saldo pengguna; di bawah 100% kredit Surplus tidak cukup bila semua saldo dipakai",
    coverageNone: "tidak dihitung",
    negative: "Akun saldo negatif",
    deposits: "Deposit terbuka",
    depositsNote: (pending: number, stuck: number) => `${pending} menunggu bayar · ${stuck} macet lewat kedaluwarsa`,
  },
  trend: {
    title: "Tren 30 hari",
    usageTitle: "Pemakaian ditagih dan biaya Surplus per hari",
    usageCaption: "Pemakaian ditagih dan biaya Surplus per hari, 30 hari terakhir",
    charge: "Ditagih",
    cost: "Biaya Surplus",
    requestsTitle: "Request per hari",
    requestsCaption: "Request berhasil dan gagal per hari, 30 hari terakhir",
    ok: "Berhasil atau berjalan",
    failed: "Gagal",
    date: "Tanggal",
    empty: "Belum ada request dalam 30 hari terakhir",
    emptyBody: "Grafik terisi setelah pengguna memanggil API dengan key mereka.",
  },
};

/** One sentence per alert; count is how many (1 for yes/no facts). */
export const alertText: Record<AlertKind, { label: string; text: (count: number) => string }> = {
  surplusUnreadable: { label: "Surplus", text: () => "Saldo nbytes di Surplus tidak bisa dibaca. Cek key Surplus dan dashboard Surplus." },
  coverageLow: { label: "Saldo", text: () => "Saldo nbytes di Surplus lebih kecil dari total saldo pengguna. Isi kredit Surplus." },
  serviceUnavailable24h: { label: "Surplus", text: (n) => `${n} request 24 jam gagal karena key, kredit, atau batas belanja nbytes di Surplus.` },
  negativeMargin24h: { label: "Margin", text: (n) => `${n} request 24 jam biayanya di atas tagihan ke pengguna.` },
  webhookMismatch7d: { label: "Pembayaran", text: (n) => `${n} webhook Sumopod 7 hari tidak cocok dengan deposit mana pun.` },
  noExchangeRate: { label: "Kurs", text: () => "Kurs belum pernah diisi, jadi semua deposit ditolak." },
  depositsStuck: { label: "Deposit", text: (n) => `${n} deposit masih menunggu padahal sudah lewat kedaluwarsa. Cocokkan di Sumopod.` },
  costPendingOld: { label: "Biaya", text: (n) => `${n} request lebih dari 24 jam biaya Surplusnya belum diketahui.` },
  negativeBalances: { label: "Saldo", text: (n) => `${n} akun saldonya negatif; request mereka ditolak sampai deposit.` },
  adminLocked24h: { label: "Keamanan", text: (n) => `Login admin dikunci ${n} kali dalam 24 jam.` },
  totpFailed24h: { label: "Keamanan", text: (n) => `${n} kode authenticator admin salah dalam 24 jam.` },
};
