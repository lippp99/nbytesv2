import type { BadgeTone } from "@/components/app-kit/badge";
import type { AdminRequestRow, RequestFilter } from "@/lib/admin-gateway/request-log-contract";

// Text of the admin Request log page (PRD admin-requests-upstream §3).
export const requestsCopy = {
  title: "Request log",
  sub: "Request API dari semua pengguna: tagihan, biaya Surplus dan margin. Isi prompt dan jawaban tidak pernah disimpan.",
  loading: "Memuat request",
  search: "Cari request",
  searchPlaceholder: "Email, id model, atau id request",
  searchSubmit: "Cari",
  filterLabel: "Status request",
  costPending: "Hanya biaya menunggu",
  count: (total: number) => `${total} request`,
  cols: {
    at: "Waktu (UTC)", user: "Pengguna", model: "Model", status: "Status", latency: "Latensi", input: "Token input",
    output: "Token output", charge: "Tagihan", cost: "Biaya Surplus", margin: "Margin",
  },
  stream: "stream",
  deletedUser: "akun dihapus",
  costWaiting: "menunggu",
  truncated: "terpotong",
  idLabel: "id",
  surplusIdLabel: "Surplus",
  empty: { title: "Belum ada request", body: "Request muncul di sini setelah pengguna memanggil API dengan key mereka." },
  noMatch: { title: "Tidak ada yang cocok", body: "Ubah pencarian atau saringan." },
  costNote: "Biaya Surplus kosong berarti belum diketahui (tampil \"menunggu\"), bukan nol. Margin hanya dihitung bila biayanya diketahui.",
  pagination: { nav: "Halaman request log", pageOf: (p: number, n: number) => `Halaman ${p} dari ${n}`, previous: "Sebelumnya", next: "Berikutnya" },
};

export const filterLabels: Record<RequestFilter, string> = { all: "Semua", succeeded: "Berhasil", failed: "Gagal", pending: "Berjalan" };

export const stateBadge: Record<AdminRequestRow["state"], { tone: BadgeTone; label: string }> = {
  succeeded: { tone: "success", label: "Berhasil" },
  failed: { tone: "danger", label: "Gagal" },
  pending: { tone: "warning", label: "Berjalan" },
};
