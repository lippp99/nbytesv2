import type { ContactChannel } from "@/lib/support/contact-contract";

// Text of the admin Contact page (owner, 2026-11-12): what users see on their "Kontak admin" page.
export const contactCopy = {
  title: "Contact",
  sub: "Kontak yang tampil di halaman Kontak admin milik pengguna. Setiap perubahan tercatat di audit log.",
  loading: "Memuat kontak",
  cardTitle: "Kanal kontak",
  cardSub: "Isi kanal yang dipakai, lalu nyalakan Tampilkan. Kanal yang dimatikan tetap tersimpan tapi tidak terlihat pengguna.",
  show: "Tampilkan ke pengguna",
  channels: {
    whatsapp: {
      label: "WhatsApp",
      placeholder: "6281234567890",
      hint: "Nomor dengan kode negara, tanpa 0 di depan. Contoh: 6281234567890 atau +62 812-3456-7890.",
    },
    telegram: {
      label: "Telegram",
      placeholder: "nbytes_support",
      hint: "Username Telegram, 5–32 huruf, angka, atau _. Boleh dengan @ atau link t.me/.",
    },
    email: { label: "Email", placeholder: "support@perusahaan.com", hint: "Alamat email yang dibalas admin." },
  } satisfies Record<ContactChannel, { label: string; placeholder: string; hint: string }>,
  required: "Isi dulu sebelum ditampilkan, atau matikan Tampilkan.",
  invalid: {
    whatsapp: "Nomor tidak valid. Pakai kode negara (misalnya 62), 8–15 angka, tanpa 0 di depan.",
    telegram: "Username tidak valid. 5–32 karakter: huruf, angka, atau _.",
    email: "Alamat email tidak valid.",
  } satisfies Record<ContactChannel, string>,
  save: "Simpan kontak",
  saving: "Menyimpan…",
  saved: "Kontak tersimpan. Halaman Kontak admin pengguna sudah memakai isian ini.",
  failed: "Kontak belum tersimpan. Coba lagi sebentar lagi.",
  offline: "Tidak ada koneksi internet.",
};
