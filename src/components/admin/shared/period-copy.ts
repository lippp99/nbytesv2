import type { PeriodKind, RangeProblem } from "@/lib/admin-gateway/usage-contract";

// Text of the period picker shared by the admin Usage and Leaderboard pages.
export const periodCopy = {
  periodLabel: "Periode",
  monthLabel: "Bulan",
  yearLabel: "Tahun",
  fromLabel: "Dari",
  toLabel: "Sampai",
  apply: "Terapkan",
  loading: "Memuat…",
};

export const periodLabels: Record<PeriodKind, string> = { month: "Bulan", year: "Tahun", range: "Rentang tanggal" };

export const rangeErrorText: Record<RangeProblem, string> = {
  invalid: "Isi kedua tanggal dengan lengkap.",
  order: "Tanggal mulai harus sebelum atau sama dengan tanggal akhir.",
  future: "Tanggal akhir tidak boleh setelah hari ini (UTC).",
  too_long: "Rentang paling panjang 366 hari. Untuk lebih lama, pilih Tahun.",
};
