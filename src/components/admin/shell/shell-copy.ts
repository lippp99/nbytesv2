// Text of the admin frame: sidebar, header and drawer.
export const shellCopy = {
  admin: "Admin",
  home: "nbytes Admin, ke ringkasan",
  navLabel: "Menu admin",
  openMenu: "Buka menu",
  closeMenu: "Tutup menu",
  openSidebar: "Buka sidebar",
  closeSidebar: "Tutup sidebar",
  darkMode: "Mode gelap",
  signOut: "Keluar",
  owner: "Owner",
  pageError: {
    title: "Halaman ini belum bisa dimuat",
    body: "Ada gangguan saat mengambil data. Coba lagi; kalau tetap gagal, cocokkan kode kejadian di log server.",
    retry: "Coba lagi",
    home: "Ke Ringkasan",
    ref: (digest: string) => `Kode kejadian: ${digest}`,
  },
  footer: {
    note: "© 2026 nbytes · Konsol admin, khusus tim internal",
    label: "Tautan footer admin",
    links: [
      { href: "/admin/audit", label: "Audit log" },
      { href: "/admin/settings", label: "Pengaturan" },
    ],
  },
};
