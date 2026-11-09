export type Filter = "all" | "ok" | "error";

// Text of the admin requests page.
export const requestsCopy = {
  title: "Request log",
  sub: "Request terbaru dari semua pengguna. Isi prompt dan respons tidak pernah disimpan di sini.",
  filter: "Saring status",
  filters: { all: "Semua", ok: "Berhasil", error: "Error" } satisfies Record<Filter, string>,
  cols: { at: "Waktu (UTC)", user: "Pengguna", model: "Model", status: "Status", latency: "Latensi", tokens: "Token", cost: "Biaya" },
  empty: "Tidak ada request",
  emptyBody: "Belum ada request dengan status ini. Ganti saringan ke Semua.",
};
