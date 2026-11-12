import type { ContactChannel } from "@/lib/support/contact-contract";

// Text of the user's "Kontak admin" page (owner, 2026-11-12). The channels come from the admin Contact page.
export const contactCopy = {
  title: "Kontak admin",
  sub: "Butuh bantuan soal akun, saldo, atau API? Hubungi admin lewat salah satu kanal di bawah.",
  loading: "Memuat kontak",
  channels: {
    whatsapp: { label: "WhatsApp", open: "Buka WhatsApp" },
    telegram: { label: "Telegram", open: "Buka Telegram" },
    email: { label: "Email", open: "Kirim email" },
  } satisfies Record<ContactChannel, { label: string; open: string }>,
  newTab: "(tab baru)",
  empty: {
    title: "Kontak admin belum tersedia",
    body: "Admin belum menambahkan kanal kontak. Coba lagi nanti.",
  },
};
