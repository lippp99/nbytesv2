// Text of the admin Leaderboard page. Figures come from gateway_requests; nothing here is an example.
export const leaderboardCopy = {
  title: "Leaderboard",
  sub: "Pengguna dan model dengan token terbanyak (input + output) untuk periode pilihan. Waktu dalam WIB.",
  loading: "Memuat leaderboard",
  users: {
    title: (n: number) => `${n} pengguna dengan token terbanyak`,
    description: "Request dan model tanpa yang gagal. Klik email untuk melihat pemakaiannya di halaman Usage.",
    empty: "Belum ada pengguna yang memakai token di periode ini.",
    share: (n: number, pct: string) => `${n} teratas memakai ${pct} dari semua token periode ini.`,
  },
  models: {
    title: (n: number) => `${n} model dengan token terbanyak`,
    description: "Nama dari Models & pricing bila ada. Request tanpa yang gagal. Klik id model untuk melihat request-nya.",
    empty: "Belum ada model yang dipakai di periode ini.",
  },
  cols: {
    rank: "Peringkat", user: "Pengguna", model: "Model", tokens: "Token", share: "Porsi token", requests: "Request",
    models: "Model", favouriteModel: "Model favorit",
  },
  favouriteNote: (tokens: string) => `${tokens} token`,
  none: "—",
  empty: {
    title: (period: string) => `Belum ada pemakaian di ${period}`,
    body: "Pilih periode lain, atau tunggu sampai pengguna memanggil API dengan key mereka.",
  },
  note: "Peringkat dari jumlah token input dan output. Akun yang dihapus ikut di total token tapi tidak diberi peringkat.",
};
