// Text and mock figures of the admin overview. Every number is an example; money in integer micro-dollars.
export const overviewCopy = {
  title: "Ringkasan",
  sub: "Kesehatan gateway, pemakaian dan pendapatan, diperbarui tiap menit.",
  summary: "Angka utama",
  stats: { revenue: "Pendapatan bulan ini", users: "Pengguna aktif (30 hari)", requests: "Request 24 jam", errors: "Error rate 24 jam" },
  providers: "Status provider",
  providersSub: "Upstream yang dipakai 24 jam terakhir",
  seeAll: "Lihat semua",
  cols: { provider: "Provider", status: "Status", latency: "Latensi p50", errors: "Error" },
  alerts: "Peringatan",
  alertsSub: "Butuh perhatian tim",
};

export const overviewFigures = {
  revenueMicros: 48_216_400_000,
  revenueNote: "+12% dari Oktober",
  activeUsers: 1_284,
  usersNote: "37 pendaftar baru minggu ini",
  requests24h: 412_612,
  requestsNote: "puncak 09:00 UTC",
  errorRatePct: "0.61%",
  errorNote: "naik karena xAI gangguan",
};

export type Alert = { id: string; tone: "danger" | "warning"; label: string; title: string; at: string };

export const alerts: Alert[] = [
  { id: "al_1", tone: "danger", label: "Gangguan", title: "xAI menolak semua request (HTTP 503). Fallback ke model lain aktif.", at: "2026-11-08T08:52:00Z" },
  { id: "al_2", tone: "warning", label: "Lambat", title: "Latensi Google naik ke 918 ms (normal ~400 ms).", at: "2026-11-08T08:31:00Z" },
  { id: "al_3", tone: "warning", label: "Saldo", title: "3 akun Paket Pro saldonya di bawah $5.", at: "2026-11-08T06:00:00Z" },
  { id: "al_4", tone: "warning", label: "Keamanan", title: "5 percobaan TOTP gagal untuk sari@nbytes.example.", at: "2026-11-07T22:14:00Z" },
];
