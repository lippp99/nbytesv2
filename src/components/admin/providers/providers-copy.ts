// Text of the admin providers page.
export const providersCopy = {
  title: "Provider",
  sub: "Kesehatan upstream 24 jam terakhir. Provider yang dinonaktifkan dilewati; request pindah ke model cadangan.",
  cols: { provider: "Provider", status: "Status", uptime: "Uptime", latency: "Latensi p50", errors: "Error", requests: "Request 24 jam", routing: "Routing" },
  on: "Aktif",
  off: "Nonaktif",
  disable: "Nonaktifkan",
  enable: "Aktifkan",
  // shortcut: the toggle only changes this page's state; the real switch needs the admin API and an audit entry
  note: "Mode demo: perubahan tidak disimpan dan belum tercatat di audit log.",
};
