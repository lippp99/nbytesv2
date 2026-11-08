# prd frontend

Prompt untuk sesi AI agent baru yang mengimplementasikan frontend sesuai PRD. Salin semua isi di bawah garis ke sesi baru.

---

Sebelum mengerjakan apa pun, lakukan ini berurutan:

1. Patuhi CLAUDE.md, AGENTS.md, dan semua aturan di `.claude/rules/` (architecture.md, backend-security.md, tooling.md, git.md). Buka berkas yang belum termuat sebelum mengedit.
2. Cek branch aktif dengan `git status -sb`. Kerja di `develop` (atau branch fitur dari `develop`), jangan pernah langsung di `master`.
3. Cari berkas yang tepat lewat grep di PROJECT_MAP.md (jangan dibaca utuh), lalu cocokkan dengan filesystem. Setelah struktur berubah, jalankan `npm run map`.
4. Gunakan ponytail.
5. Pakai tool sesuai `.claude/rules/tooling.md`: untuk Next.js baca `nextjs_docs` (next-devtools) dulu; untuk docs library lain (shadcn, next-themes, Tailwind) pakai context7.
6. Gunakan `allow_large: true` saat membaca berkas besar yang memang perlu dibaca utuh.

Aturan kerja:
- Jangan menebak. Kalau informasi ada di file proyek atau di situs referensi, buka dan baca. Jangan mengarang struktur, nama file, atau isi kode. Yang tidak bisa dibuktikan ditulis "belum dibuktikan".
- Ikuti instruksi apa adanya. Kalau instruksi bertentangan dengan aturan proyek atau berisiko, sebutkan sekali beserta alasannya lalu tunggu keputusan owner.
- Kerjakan hanya yang diminta, jangan ubah bagian lain.
- Sebelum selesai: `npx tsc --noEmit` dan `npm run lint` harus lolos.
- Jangan commit atau push kecuali owner minta. Merge atau push ke `master` hanya atas perintah owner.

## Tugas

Implementasikan **frontend saja** (UI/UX & visual) untuk landing page `/` dan halaman masuk OTP 8 digit `/login`, memakai data mockup, sesuai PRD `PRD/landing-and-otp-login.md`. Backend (API, database, email, sesi) **tidak** dikerjakan.

## Langkah 1: Baca PRD utuh

- Baca `PRD/landing-and-otp-login.md` **seluruhnya** dengan `allow_large: true`. Jangan membaca sebagian lalu menyimpulkan.
- Catat untuk dirimu sendiri: token (§3), struktur section (§4), state login (§5), bentuk data mock (§6), peta aset dan cara menampilkan logo (§7), lokasi file (§8), tabel responsif (§9), a11y (§10), kriteria penerimaan (§11), keputusan owner yang masih terbuka (§12).

## Langkah 2: Baca sumber referensi langsung (jangan hanya mengandalkan PRD)

PRD adalah ringkasan. Sebelum menulis kode, verifikasi dan lengkapi dari sumber aslinya.

**a. Situs referensi lewat Pencil MCP server (wajib)**

Pakai tool `mcp__pencil__browser` (load dulu via ToolSearch jika masih deferred; parameter `filePath` boleh string kosong bila tidak ada file `.pen`). Untuk tiap URL berikut:

- https://jatevo.ai/
- https://jatevo.ai/app/login
- https://www.experientiallabs.ai/
- https://platform.experientiallabs.ai/signin

Lakukan:
1. `load-page` lalu `return-screenshot` (full page) untuk melihat struktur lengkap dari atas sampai footer.
2. Konten jatevo baru muncul setelah di-scroll (animasi masuk). Scroll dulu lewat `cdp` `Runtime.evaluate` (loop `scrollTo` dengan jeda, `awaitPromise: true`) sebelum screenshot, supaya bagian bawah tidak kosong.
3. Petakan struktur halaman: daftar `section/header/footer/nav` beserta tinggi, padding, dan teks ringkasnya; semua `h1–h3` dengan font-size, weight, line-height, letter-spacing; tombol dan link dengan tinggi, padding, radius, warna, border, transition (lewat `cdp` `Runtime.evaluate` + `getComputedStyle`).
4. Ambil CSS custom properties `:root`, `@keyframes`, dan media query dari `document.styleSheets`.
5. Untuk bagian yang relevan (hero, tabel model, blok kode, grid logo, form login) pakai `return-element` dengan `target: "query"` dan selector spesifik. Jangan `return-element` pada `body`/`html` (output terlalu besar).
6. Cek tampilan mobile: `cdp` `Emulation.setDeviceMetricsOverride` (390×844, `mobile: true`), muat ulang, screenshot, lalu kembalikan dengan `Emulation.clearDeviceMetricsOverride`.
7. Jangan mengisi atau mengirim form login referensi (butuh data asli).

Bandingkan hasilmu dengan §2 PRD. Jika ada nilai yang berbeda (situs bisa berubah), laporkan perbedaannya ke owner; jangan diam-diam mengubah arah desain.

**b. LobeHub Icons**

- Baca https://lobehub.com/icons/skill.md (dialihkan ke `lobehub.com/only-ai/skills/icons`) dan contoh https://lobehub.com/icons/gemini.
- Ikuti keputusan §7.3: unduh SVG **mono** dari `@lobehub/icons-static-svg@1.102.0` ke `public/models/` dengan perintah di PRD, buka beberapa file untuk memastikan isinya SVG. **Jangan** install `@lobehub/icons` (React) dan jangan hotlink CDN.

**c. Docs versi terpasang**

- Next.js 16.4.5: `node_modules/next/dist/docs/` (fonts, image, metadata `app-icons.md` dan `opengraph-image.md`, route groups). Ingat: `middleware` sudah diganti `proxy` di versi ini (tidak dipakai di tugas ini).
- shadcn `base-nova` (Base UI, bukan Radix): cek tiap komponen dengan `npx shadcn@latest view <name>` sebelum `add`. Komponen yang dibutuhkan: `input`, `label`, `input-otp`, `sheet`, `accordion`, `tabs`. `input-otp` menambah dependensi npm `input-otp`; itu sudah direncanakan PRD.
- Font: pastikan ulang Funnel Display, Funnel Sans, Martian Mono ada di `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`.

## Langkah 3: Implementasi

Ikuti urutan di §11 PRD:
1. Token: ganti Geist di `src/app/layout.tsx` dengan font §3.2; warna OKLCH light/dark, `--accent-mark`, `--success`, radius 2px di `src/app/globals.css`; metadata judul/deskripsi.
2. Tambah primitif shadcn lewat CLI. Jangan edit `src/components/ui/` dengan tangan.
3. Unduh logo LobeHub (§7.3). Aset brand §7.2 belum ada: pakai wordmark teks sementara, jangan membuat logo karangan.
4. `src/components/provider-logo.tsx` dengan CSS mask (§7.3), lalu landing section per section dengan `src/components/landing/landing-mock-data.ts` dan `src/lib/price-format.ts`.
5. `/login` di `src/app/(auth)/login/page.tsx` dengan `src/lib/auth-contract.ts` dan mock `src/lib/auth-client.ts` (§6.2), termasuk semua state §5.4.
6. Unit test kecil untuk `auth-contract.ts` dan `price-format.ts` (per 2026-11-08 `package.json` belum punya test runner; tanyakan owner sebelum menambah dependensi, atau pakai `node:test` bawaan Node jika owner setuju).

## Tambahan dari sesi penyusun PRD (wajib diperhatikan)

- **Referensi adalah arah, bukan bahan salinan.** Jangan menyalin nama brand, copy, logo, ilustrasi, warna oranye jatevo, hijau experiential, atau tombol offset-oranye mereka. Ambil prinsipnya (§2.3), terapkan dengan token PRD.
- **Keputusan owner §12 belum dijawab** (nama produk, bahasa, font/warna final, daftar provider, teks pendaftaran). Pakai default PRD (nama kerja "nbytes", font dan warna rekomendasi), tandai di laporan, dan simpan semua teks UI di satu tempat per fitur supaya mudah diganti. Jangan menebak nama produk final.
- **Bahasa UI** belum diputuskan: pakai Bahasa Indonesia sesuai copy di PRD, `lang="id"`.
- **Anti AI slop (§3.7) adalah gerbang rilis.** Sebelum melapor selesai, cek tiap butir dan laporkan hasilnya satu per satu.
- **Motion hanya fade opacity.** Tanpa blur, translate, scale, loop, typewriter. Caret `input-otp` statis (keyframe `animate-caret-blink` tidak ada di `shadcn/tailwind.css` terpasang). Konten harus terlihat tanpa JS dan saat `prefers-reduced-motion`.
- **Tanpa nilai arbitrer** di TSX (`w-[437px]`, warna hex). Semua dari token atau skala Tailwind. Jika butuh nilai baru, tambahkan sebagai token di `globals.css`.
- **Server Component default.** `"use client"` hanya untuk leaf interaktif: menu mobile, tab kode, tombol salin, filter tabel, FAQ, form login, fade-in observer.
- **Batas ukuran file** dari `architecture.md`: komponen ≤ 200 baris (maks. 300), fungsi ≤ 40 baris. Pecah sebelum melebihi.
- **Jangan menambah library** (animasi, ikon, validasi, state) tanpa izin owner. `lucide-react` sudah ada untuk ikon UI.
- **Data mock** tidak boleh berisi testimoni, logo pelanggan, atau klaim pemasaran. Harga integer mikro-dolar, base URL `api.example.com`.
- **Verifikasi visual di browser**, bukan hanya typecheck: jalankan dev server lewat `preview_start` (`.claude/launch.json` belum ada per 2026-11-08; buat dengan `npm run dev`, port 3000), buka `/` dan `/login` di built-in browser, screenshot di lebar 360, 390, 768, 1024, 1280, 1440, light dan dark. Pastikan tidak ada scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`) dan 8 slot OTP muat di 360px. Bandingkan berdampingan dengan screenshot referensi dari Langkah 2 untuk jarak antarsection dan hierarki tipografi.
- **Cek kontras** pasangan warna token (teks ≥ 4.5:1, teks besar/ikon/border fokus ≥ 3:1) dan laporkan angkanya; PRD menandai ini "belum dibuktikan".
- **Uji semua state login** lewat aturan mock: email `@limit.test`, `@down.test`, kode `12345678`, `00000000`, kode salah sampai percobaan habis, paste `1234-5678`, hitung mundur kirim ulang, navigasi keyboard saja.
- Jika menemukan PRD salah atau tidak bisa diterapkan, berhenti di bagian itu, jelaskan ke owner dengan bukti, dan lanjutkan bagian lain.

## Selesai berarti

- Kriteria penerimaan §11 PRD terpenuhi, atau yang belum ditulis jelas beserta alasannya.
- `npx tsc --noEmit` dan `npm run lint` lolos; `npm run map` sudah dijalankan.
- Tidak ada commit atau push.

## Format laporan akhir

1. Ringkas apa yang dibuat (file baru/diubah, dengan path).
2. Perbedaan antara situs referensi saat ini dan §2 PRD (jika ada).
3. Hasil checklist anti-slop §3.7 dan kriteria §11, per butir: lolos / gagal / belum dibuktikan.
4. Angka kontras warna yang diukur.
5. Screenshot yang diambil (lebar dan tema).
6. Keputusan owner yang dipakai default-nya, dan pertanyaan yang perlu dijawab.
