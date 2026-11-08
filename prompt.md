Sebelum mengerjakan apa pun, lakukan ini berurutan:

1. Patuhi CLAUDE.md, AGENTS.md, dan semua aturan di `.claude/rules/` (architecture.md, backend-security.md, tooling.md, git.md). Buka berkas yang belum termuat sebelum mengedit.
2. Cek branch aktif dengan `git status -sb`. Kerja di `develop` (atau branch fitur dari `develop`), jangan pernah langsung di `master`.
3. Cari berkas yang tepat lewat grep di PROJECT_MAP.md (jangan dibaca utuh), lalu cocokkan dengan filesystem. Setelah struktur berubah, jalankan `npm run map`.
4. Gunakan ponytail.
5. Pakai tool sesuai `.claude/rules/tooling.md`: untuk Next.js baca `nextjs_docs` (next-devtools) dulu; untuk docs library lain (Drizzle, shadcn, next-themes, Tailwind, Docker, Postgres) pakai context7.
6. Gunakan `allow_large: true` saat membaca berkas besar yang memang perlu dibaca utuh.

Aturan kerja:
- Jangan menebak. Kalau informasi ada di file proyek, baca filenya. Jangan mengarang struktur, nama file, atau isi kode. Yang tidak bisa dibuktikan ditulis "belum dibuktikan".
- Ikuti instruksi saya apa adanya. Kalau instruksi bertentangan dengan aturan proyek atau berisiko (uang, data pengguna, database, production), sebutkan sekali beserta alasannya lalu tunggu keputusan saya.
- Kerjakan hanya yang saya minta, jangan ubah bagian lain.
- Sebelum selesai: `npx tsc --noEmit` dan `npm run lint` harus lolos.
- Jangan commit atau push kecuali saya minta. Merge atau push ke `master` hanya atas perintah saya.
- Migrasi DB ke database selain lokal dan `docker compose down -v` hanya atas persetujuan saya.

Setelah itu kerjakan tugas berikut:
