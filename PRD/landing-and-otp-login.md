# PRD: Frontend UI/UX & Visual · Landing Page & Login OTP (AI Gateway)

| | |
|---|---|
| Status | Draft v3, khusus frontend (UI/UX & visual). Backend sengaja tidak dibahas. v3: logo model/provider dari LobeHub Icons (§7.3). |
| Tanggal | 2026-11-08 |
| Repo | `nbytesv2` (branch `develop`) |
| Nama produk | **belum diputuskan**. Dokumen ini memakai nama kerja "nbytes" (dari nama repo). |
| Cakupan | Tampilan dan interaksi landing page + halaman masuk OTP 8 digit, memakai **data mockup** |
| Di luar cakupan | Semua backend: API, database, pengiriman email, sesi, keamanan server (§13) |

Aturan baca: setiap angka di §2 diukur langsung dari situs referensi (computed style lewat browser Pencil, 2026-11-08, viewport 1129px dan 390px). Hal yang tidak bisa dibuktikan ditandai **belum dibuktikan**.

---

## 1. Tujuan

1. Landing page yang menjelaskan dalam satu layar pertama: apa produknya (satu API key untuk banyak model AI), untuk siapa (developer/tim produk), dan langkah berikutnya (dapatkan API key).
2. Halaman masuk tanpa password: email → kode 8 digit → masuk. Di fase ini alurnya disimulasikan dengan mock, tanpa server.
3. Visual yang terasa dibuat dengan sengaja, bukan template AI: tipografi tidak pasaran, warna tenang, animasi hanya fade in/out, jarak antarsection konsisten, rapi di mobile sampai layar lebar.

### Metrik keberhasilan (frontend)

| Metrik | Target |
|---|---|
| LCP (mobile, 4G) | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Lighthouse Accessibility | ≥ 95 |
| Scroll horizontal halaman | 0 di lebar 320–1920px |

---

## 2. Riset referensi (bukti terukur)

### 2.1 jatevo.ai

Catatan: domain `jatevo.ai` saat diakses menampilkan brand **"Oyenza Inference · by Jatevo"** (judul halaman: *Oyenza Inference · Frontier models, billed to the token*).

| Aspek | Nilai terukur |
|---|---|
| Font | `--sans: Inter`; `--mono: Geist Mono`; `--display: "Stack Sans Notch"` (didefinisikan, heading tetap Inter) |
| Body | 14px, background `#ffffff` |
| H1 | desktop 58px / lh 60.32px / weight 500 / tracking −2.03px; mobile (390px) 40px / lh 41.6px |
| H2 | 44px / lh 47.52px / weight 500 / tracking −1.32px |
| H3 | 20px / 500 (kartu), 16px / 500 (fitur) |
| Container | `max-width: 1144px`, padding samping 16px |
| Padding section | desktop 96px atas / 104px bawah; mobile hero 56/72px, section lain 64px |
| Warna | ink `#0f0f0e`, ink-2 `#3a3a36`, muted `#6e6d64`, faint `#9a998e`, plate `#f7f7f6`, plate-2 `#efefec`, guide `#e6e6e1`, line `rgba(15,15,14,.09/.16/.32)` |
| Aksen | brand `#f0892e`, brand-2 `#e2741a`, brand-ink `#9a4a0b`, brand-soft `#fff1e2`; ok `#1a7f4b`; bad `#b42318`; warn `#8a5a00` |
| Tombol utama | `.b-brand`: span oranye + `::before` blok `rgb(184,90,14)` digeser `translate(4px,4px)` (bayangan offset solid), radius 0, tinggi 42px (lg) |
| Tombol sekunder | `.b-grey`: bg `#efefec`, tinggi 38px, padding 0 16px, radius 0 |
| Control height | `--control: 32px`; tombol nav "Sign in" 36px |
| Durasi transisi | `--t-fast .12s`, `--t-base .15s`, `--t-slow .19s`; easing `cubic-bezier(.22,1,.36,1)` dan `cubic-bezier(.16,1,.3,1)` |
| Animasi | `enter-up` (opacity + **blur 6px** + translateY 16px), `word-in` per kata dengan blur, `hl-snap` highlight **berulang tiap 10s**, `hatch-drift`, `live` (pulse tak berujung), `bob`, `march`, caret blink. Ada `prefers-reduced-motion` yang mematikan semuanya. |
| Elemen khas | garis panduan putus-putus di tepi layout (`--guide`), blok highlight oranye di belakang kata kunci headline, chart harga dot-plot interaktif di hero, ikon model dalam kotak 1:1 bergaris tipis |
| Breakpoint di CSS | 359, 420, 639/640, 760, 900, 980, 1000, 1240px |
| Login (`/app/login`) | email + password, field 38px bg `#f7f7f6` border putus-putus, tombol submit 40px gaya offset sama; daftar butuh kode undangan |

### 2.2 experientiallabs.ai

| Aspek | Nilai terukur |
|---|---|
| Font | `Schibsted Grotesk` (body & heading), `JetBrains Mono` (wordmark, kode, label). Geist/Geist Mono juga dimuat di sebagian elemen. |
| Body | 16px, background `#ffffff` |
| H1 | 47.43px / lh 49.32px / weight **400** / tracking −1.90px |
| H2 | 38.39px / lh 41.46px / 400 / tracking −1.34px |
| H3 | 26px / 400 / tracking −0.52px |
| Layout var | `--content-width: 1240px`, `--gutter: clamp(16px,3vw,32px)`, `--reading-width: 640px`, `--sec-pad: 48px`, `--head-gap: 24px` |
| Padding section terukur | ±65.9px atas & bawah; nav 68px |
| Warna | ink `rgb(15,17,15)`, muted `rgb(107,110,107)`, plate `rgb(244,245,244)`; aksen hijau `rgb(22,138,73)`; tint hijau `rgb(201,232,214)`; footer gelap `rgb(20,22,20)` |
| Tombol | radius 0, tinggi 38px (nav) / ±48px (hero), padding 0 16px, 15px weight 500; primer hijau solid, sekunder garis 1px `rgb(220,220,220)`; transisi warna 0.15s |
| Animasi | sebagian besar fade/translate kecil (`fadeIn`, `opt-caption-in` 4px, `u-book-up`), ada siklus berulang (`rel-err-cycle`, `slowSpin`, `hf-ring`) dan caret blink |
| Elemen khas | highlight hijau di belakang kata headline, mock dashboard "Logs" produk di hero, tabel data monospace, kartu bento abu/hitam/hijau muda, kode `curl` dengan tab model, grid logo provider 6×2 dalam kotak abu |
| Breakpoint di CSS | ±37 media query (360 s/d 1321px), termasuk `forced-colors` dan `print` |
| Login (`platform.experientiallabs.ai/signin`) | layout dua kolom gelap; kiri: Google, GitHub, "or", email 48px, tombol "Continue" hijau 48px, link "Sign in with password"; kanan: pesan nilai produk + daftar model. Langkah setelah email **belum dibuktikan** (tidak disubmit, karena butuh email asli). |

### 2.3 Yang diambil, yang diperbaiki

| Ambil (terbukti bekerja di kedua referensi) | Perbaiki / tolak |
|---|---|
| Latar terang netral, satu aksen, sudut tegas (radius 0–2px) | Kedua referensi pakai Inter/Geist/Schibsted → kita pakai font lain (§3.2) |
| Hero yang menampilkan **UI produk** (tabel log, chart harga, kode), bukan ilustrasi | Blur pada animasi masuk, animasi per kata, loop tak berujung → dilarang (§3.6) |
| Tabel data monospace, angka tabular | Body 14px di jatevo terlalu kecil untuk paragraf → body 16px |
| Garis tipis sebagai struktur, bukan bayangan | Tombol offset-shadow jatevo terlalu "mainan" untuk semua tombol → hanya satu varian primer dengan bayangan solid tipis yang hilang saat ditekan |
| Copy pendek, kalimat biasa | Padding section mobile jatevo 56/72 tidak simetris → skala simetris (§3.4) |
| `prefers-reduced-motion` dihormati | Banyak breakpoint ad-hoc → pakai 5 breakpoint default Tailwind v4 |
| | Konten jatevo kosong sebelum di-scroll (animasi masuk menahan konten) → konten selalu terlihat tanpa JS (§3.6) |

---

## 3. Arah visual

### 3.1 Prinsip

1. **Produk adalah ilustrasinya.** Visual utama = UI gateway yang dibangun dengan HTML (tabel log, kode, daftar model) berisi data mockup. Tanpa gambar 3D, orb, gradien, glassmorphism.
2. **Satu aksen, dipakai hemat.** Maks. satu elemen beraksen per layar (biasanya highlight headline atau tombol primer).
3. **Garis, bukan bayangan.** Pemisah 1px; bayangan hanya pada tombol primer dan popover.
4. **Tenang saat bergerak.** Hanya fade in/out.
5. **Sistem, bukan dekorasi.** Semua nilai dari token (§3.3–3.4), tanpa nilai arbitrer di TSX.

### 3.2 Tipografi

Diverifikasi ada di `next/font/google` versi terpasang (`node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`), di-self-host otomatis oleh `next/font` (docs: `01-getting-started/13-fonts.md`). Tidak perlu menyiapkan file font sendiri.

| Peran | Rekomendasi | Cadangan | Alasan |
|---|---|---|---|
| Display (H1–H3) | **Funnel Display** (variable, wght 300–800) | Familjen Grotesk (400–700) | Grotesk dengan karakter (terminal huruf terpotong), jarang dipakai situs AI |
| Body / UI | **Funnel Sans** (variable, 300–800) | Instrument Sans (wdth 75–100, wght 400–700) | Satu keluarga dengan display, x-height nyaman di 16px |
| Mono (kode, OTP, angka tabel) | **Martian Mono** (variable, wdth 75–112.5, wght 100–800) | Fragment Mono (400 saja) | Digit lebar dan jelas, cocok untuk 8 slot OTP |

Dilarang: Geist, Geist Mono, Inter, Plus Jakarta Sans, Poppins, Montserrat, Roboto, Open Sans, Space Grotesk, DM Sans, Manrope, Schibsted Grotesk (dipakai referensi), JetBrains Mono (dipakai referensi).

Catatan implementasi: `src/app/layout.tsx` saat ini memuat `Geist` dan `Geist_Mono`, dan `globals.css` memetakan `--font-mono: var(--font-geist-mono)`. Keduanya harus diganti.

Subset: `latin` + `latin-ext` (cukup untuk Bahasa Indonesia & Inggris).

**Skala tipe** (mobile → desktop, `clamp` antara 360px dan 1280px):

| Token | Mobile | Desktop | Line-height | Tracking | Weight |
|---|---|---|---|---|---|
| `display` (H1) | 40px | 64px | 1.02 | −0.035em | 500 |
| `h2` | 30px | 44px | 1.08 | −0.03em | 500 |
| `h3` | 20px | 24px | 1.2 | −0.01em | 500 |
| `lead` | 18px | 20px | 1.5 | 0 | 400 |
| `body` | 16px | 16px | 1.6 | 0 | 400 |
| `small` | 14px | 14px | 1.5 | 0 | 400 |
| `mono` | 13px | 14px | 1.5 | 0 | 400, `font-variant-numeric: tabular-nums` |
| `label` (eyebrow) | 12px | 12px | 1.3 | 0.06em, uppercase, mono | 500 |

Lebar baca paragraf maks. 64ch.

### 3.3 Warna (token OKLCH, light & dark)

Arah: netral grafit-hangat + satu aksen **lime asam** sebagai "stabilo" (highlight di belakang teks, indikator aktif). Berbeda dari oranye jatevo dan hijau experiential. Tanpa gradien, tanpa ungu/indigo, tanpa neon glow.

Token dipetakan ke variabel shadcn yang sudah ada di `src/app/globals.css` (`--background`, `--foreground`, `--primary`, dst.), jadi komponen shadcn langsung ikut.

| Token | Light | Dark | Pakai untuk |
|---|---|---|---|
| `--background` | `oklch(0.99 0.003 95)` | `oklch(0.17 0.004 95)` | latar halaman |
| `--foreground` (ink) | `oklch(0.18 0.006 95)` | `oklch(0.96 0.004 95)` | teks utama |
| `--muted-foreground` | `oklch(0.50 0.008 95)` | `oklch(0.70 0.008 95)` | teks sekunder |
| `--muted` (plate) | `oklch(0.965 0.004 95)` | `oklch(0.22 0.005 95)` | latar blok/kode, kotak logo |
| `--border` | `oklch(0.90 0.004 95)` | `oklch(0.30 0.005 95)` | garis 1px |
| `--primary` | `oklch(0.18 0.006 95)` (ink) | `oklch(0.96 0.004 95)` | tombol primer |
| `--primary-foreground` | `oklch(0.99 0.003 95)` | `oklch(0.17 0.004 95)` | teks tombol primer |
| `--accent-mark` (baru) | `oklch(0.92 0.19 122)` | `oklch(0.86 0.19 122)` | highlight/stabilo, bayangan tombol primer, garis tab aktif |
| `--destructive` | `oklch(0.55 0.20 27)` | `oklch(0.68 0.18 27)` | error |
| `--success` (baru) | `oklch(0.52 0.12 150)` | `oklch(0.72 0.13 150)` | status 200, "terkirim" |

Aturan kontras:
- `--accent-mark` **tidak boleh** jadi warna teks di atas latar terang; hanya sebagai latar di belakang teks ink. Rasio aktual **belum dibuktikan** sampai diuji dengan checker saat implementasi.
- Semua pasangan teks/latar ≥ 4.5:1 (teks kecil) dan ≥ 3:1 (teks ≥ 24px, ikon, border input fokus).
- Mode default: `system` (sudah begitu di `ThemeProvider`). Sediakan toggle di footer.

### 3.4 Spasi, grid, jarak antarsection

Basis 4px. Skala dipakai: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.

| Hal | Mobile (<640) | Tablet (640–1023) | Desktop (≥1024) |
|---|---|---|---|
| Gutter samping | 16px | 24px | 32px |
| Container maks. | 100% | 100% | 1200px (konten), 640px (teks) |
| Padding vertikal section | 64px atas & bawah | 80px | 112px |
| Jarak heading section → isi | 32px | 40px | 48px |
| Jarak eyebrow → heading | 12px | 12px | 16px |
| Jarak antarkartu dalam grid | 16px | 16px | 24px |
| Grid | 4 kolom | 8 kolom | 12 kolom |
| Tinggi header | 56px | 64px | 64px |

Pemisah antarsection: garis 1px `--border` selebar layar (bukan latar berganti warna di tiap section). Maksimal satu section berlatar gelap/plate per halaman (mis. blok kode).

Breakpoint: default Tailwind v4 yang terpasang (`node_modules/tailwindcss/theme.css`): `sm 40rem (640)`, `md 48rem (768)`, `lg 64rem (1024)`, `xl 80rem (1280)`, `2xl 96rem (1536)`. Tidak menambah breakpoint baru.

### 3.5 Komponen

Semua primitif via `npx shadcn@latest add <name>` (style `base-nova`, Base UI). Kustomisasi lewat token dan `className`, bukan edit `src/components/ui/`.

Radius global: `--radius: 0.125rem` (2px). Saat ini `0.625rem` di `globals.css`.

**Tombol**

| Varian | Spesifikasi |
|---|---|
| Primer | bg `--primary` (ink), teks `--primary-foreground`, 15px/500, tinggi 44px (mobile) / 40px (desktop), padding x 20px, radius 2px. Bayangan solid `3px 3px 0 var(--accent-mark)`. Hover: bayangan → `2px 2px 0`. Active: bayangan 0 + `translate(3px,3px)` (tombol "ditekan"). Transisi 120ms `ease-out`, hanya `box-shadow`/`transform`. |
| Sekunder | bg transparan, border 1px `--border`, teks ink. Hover: bg `--muted`. |
| Teks/link | underline 1px offset 4px, warna ink; hover: underline tebal 2px. |
| Ikon | kotak 40×40 (mobile 44×44), ikon lucide 16px. |
| Semua | `:focus-visible` ring 2px ink + offset 2px (bukan `outline: none`). Disabled: opacity 0.5, `cursor-not-allowed`, tanpa bayangan. Loading: label diganti teks "Mengirim…" + `aria-busy="true"` (tanpa spinner berputar). |
| Maks. per layar | satu tombol primer. |

**Input**: tinggi 44px, border 1px `--border`, bg `--background`, fokus: border ink + ring 2px `--accent-mark`. Error: border `--destructive` + pesan di bawah, `aria-invalid`, `aria-describedby`.

**Slot OTP**: lihat §5.

**Header**: logo kiri, nav tengah (≤ 5 item), "Masuk" (sekunder) + "Dapatkan API key" (primer) kanan. Sticky, latar `--background` 95% tanpa blur. <768px: nav masuk ke sheet menu (shadcn `sheet`), tombol primer tetap terlihat.

**Logo model/provider**: kotak 1:1 berlatar `--muted`, border 1px `--border`, logo di tengah. Ukuran: 20px di tabel, 24px di chip/tab, 40px di grid logo (kotak 64×64). Logo monokrom (SVG mono LobeHub) dirender lewat CSS mask supaya ikut warna teks di light/dark. Sumber dan cara pakai di §7.3.

**Blok kode**: bg `--muted` (light) / lebih gelap (dark), Martian Mono 13–14px, tab per bahasa (cURL / Python / TypeScript), tombol salin dengan konfirmasi teks "Tersalin" yang fade 150ms.

**Tabel model**: monospace untuk ID model dan angka, angka rata kanan, `tabular-nums`. Mobile: tabel jadi daftar baris (label kiri, nilai kanan), bukan scroll horizontal.

### 3.6 Motion: hanya fade in/out

| Boleh | Dilarang |
|---|---|
| Opacity 0 → 1 saat section masuk viewport, sekali saja, 200ms, `ease-out` | Blur pada animasi (dipakai jatevo) |
| Opacity 1 → 0 saat popover/menu/toast keluar, 120ms | Animasi per kata/per huruf, typewriter |
| Transisi warna/bayangan tombol 120ms | Loop tak berujung: pulse, shimmer, marquee, glow, spin, bob, caret blink dekoratif |
| Pergantian langkah login (email → OTP): fade-out 120ms lalu fade-in 200ms | Parallax, scroll-jacking, tilt 3D, kursor kustom, gradien bergerak |
| | Translate/scale masuk (termasuk "slide up 16px") |

- Semua animasi dimatikan di `prefers-reduced-motion: reduce` (konten langsung terlihat).
- Konten tidak boleh tersembunyi kalau JS gagal: state awal elemen = terlihat; kelas "belum masuk viewport" hanya ditambahkan oleh JS.
- Implementasi dengan CSS + `IntersectionObserver` atau `tw-animate-css` (sudah terpasang). Tidak menambah library animasi.
- Komponen shadcn `input-otp` (base-nova) memakai kelas `animate-caret-blink`; keyframe itu **tidak ditemukan** di `node_modules/shadcn/dist/tailwind.css` terpasang. Caret slot OTP aktif dibuat statis (garis 1px ink), bukan berkedip.

### 3.7 Daftar anti "AI slop" (wajib lolos sebelum rilis)

- [ ] Tidak ada gradien ungu/biru/pink, mesh, aurora, noise glow, orb.
- [ ] Tidak ada glassmorphism / `backdrop-blur` dekoratif.
- [ ] Tidak ada emoji sebagai ikon, tidak ada ikon "sparkles/✨" untuk "AI".
- [ ] Tidak ada headline generik ("Unlock the power of AI", "Supercharge…", "Revolutionize…").
- [ ] Tidak ada grid 3 kartu ikon-judul-teks yang identik sebagai satu-satunya isi section.
- [ ] Tidak ada testimoni, logo pelanggan, atau statistik pemasaran karangan (data mockup hanya untuk UI produk: tabel, log, kode).
- [ ] Font bukan dari daftar larangan §3.2.
- [ ] Tidak ada animasi di daftar larangan §3.6.
- [ ] Radius konsisten 2px; tidak ada kartu `rounded-2xl` + bayangan lembut besar.
- [ ] Satu tombol primer per layar.

---

## 4. Landing page

Route: `/` (`src/app/page.tsx`, saat ini masih halaman bawaan create-next-app, diganti). Server Component; bagian interaktif (tab kode, tombol salin, menu mobile, filter tabel, FAQ) jadi client leaf kecil.

### 4.1 Struktur section

| # | Section | Isi | Data mockup (§6) |
|---|---|---|---|
| 0 | Header | Logo, nav (Model, Harga, Docs, FAQ), Masuk, Dapatkan API key | — |
| 1 | Hero | Eyebrow ("OpenAI-compatible"), H1 ≤ 8 kata dengan satu kata di-stabilo `--accent-mark`, lead ≤ 2 kalimat, CTA primer + sekunder ("Lihat model"). Kanan (desktop) / bawah (mobile): panel UI produk berisi tabel log request (waktu, status, model + logo, token, biaya). | `mockRequestLogs` |
| 2 | Model | Tabel: logo + nama model, provider, konteks, harga input/output per 1M token, kemampuan (chip). Filter provider (tab). | `mockModels`, `mockProviders` |
| 3 | Cara pakai | "Ganti base URL, pakai key, selesai." Blok kode bertab cURL / Python / TypeScript, model bisa dipilih. | `mockCodeSamples` |
| 4 | Fitur gateway | Maks. 4 fitur, tiap fitur dengan contoh UI kecil (bukan ikon): fallback antarprovider (dua baris status 429 → 200), satu key semua model (grid logo provider), log & biaya per request (mini tabel), batas anggaran per key (bar pemakaian). | `mockFallback`, `mockProviders`, `mockBudget` |
| 5 | Privasi & keamanan | 3–4 poin faktual singkat dalam daftar bergaris, bukan kartu ikon. | teks placeholder |
| 6 | Harga | Tabel paket sederhana atau dihilangkan sampai model harga ada. | `mockPlans` (opsional) |
| 7 | FAQ | 5–8 pertanyaan, accordion (shadcn `accordion`), buka/tutup fade. | `mockFaq` |
| 8 | CTA penutup | H2 + satu tombol primer. | — |
| 9 | Footer | Logo, link produk/docs/legal, kontak, toggle tema, © tahun. | — |

Semua teks dan angka mockup harus terlihat masuk akal tapi tidak dirilis ke publik sebelum diganti data asli (lihat §6.3).

### 4.2 Copy

- Bahasa: **belum diputuskan** (ID, EN, atau keduanya; §12).
- Kalimat pendek, kata kerja aktif, tanpa jargon pemasaran. Contoh nada: "Satu key untuk semua model."
- Angka selalu dengan satuan.

### 4.3 Metadata

- `metadata` di `src/app/layout.tsx` saat ini masih "Create Next App" → ganti judul/deskripsi produk.
- Open Graph image statis lewat file `src/app/opengraph-image.png` (§7).
- `lang` sesuai bahasa konten.

---

## 5. Halaman Masuk (`/login`)

Satu layar, dua langkah, tanpa password, tanpa OAuth. Di fase ini semua respons disimulasikan oleh mock client (§6.2); tidak ada request ke server.

### 5.1 Layout

- Desktop (≥1024): dua kolom. Kiri: form (lebar maks. 400px, rata tengah vertikal). Kanan: panel `--muted` berisi satu kalimat nilai produk + daftar 3–4 model (logo + nama) dari mock. Panel kanan disembunyikan <1024px.
- Mobile: satu kolom, padding 16px, form mulai 48px dari header; tombol utama lebar penuh 44px.
- Header minimal: logo (link ke `/`) + "Kembali ke situs".

### 5.2 Langkah 1: Email

| Elemen | Spesifikasi |
|---|---|
| Judul | "Masuk" |
| Sub | "Kami kirim kode 8 digit ke email Anda." |
| Field | label "Email" (terlihat, bukan placeholder saja), `type="email"`, `autocomplete="email"`, `inputmode="email"`, `maxlength=254`, `autofocus` |
| Tombol | "Kirim kode" (primer, lebar penuh), state loading saat mock menunggu |
| Validasi | format email dasar di klien |
| Catatan bawah | "Belum punya akun? Kode yang sama membuat akun baru." + link Ketentuan & Privasi |

### 5.3 Langkah 2: Kode OTP

| Elemen | Spesifikasi |
|---|---|
| Judul | "Cek email Anda" |
| Sub | "Masukkan kode 8 digit yang kami kirim ke **a\*\*\*@domain.com**." + link "Ganti email" (kembali ke langkah 1) |
| Input | shadcn `input-otp` (base-nova; dependensi `input-otp`). 8 slot, dikelompokkan **4 – 4** dengan pemisah visual (bukan karakter yang ikut terketik). Satu `<input>` asli di baliknya: `autocomplete="one-time-code"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength=8`. Label tersembunyi untuk pembaca layar: "Kode verifikasi 8 digit". |
| Slot | <640px: 36×48px, gap 4px, pemisah 12px → 8×36 + 6×4 + 12 = 324px (muat di 360px − 2×16px gutter = 328px). ≥640px: 48×56px, gap 8px, pemisah 20px → 452px. Martian Mono 20px (mobile) / 24px (desktop); border 1px, slot aktif border ink + ring `--accent-mark`; caret statis. |
| Paste | Tempel "1234 5678", "1234-5678" atau "12345678" → karakter non-digit dibuang, 8 digit terisi. |
| Submit | Otomatis saat digit ke-8 terisi; tombol "Verifikasi" tetap ada (aksesibilitas, dan jika auto-submit gagal). |
| Kirim ulang | "Kirim ulang kode" nonaktif dengan hitung mundur "Kirim ulang dalam 0:60"; teks hitung mundur tidak diumumkan tiap detik ke pembaca layar. |
| Error | Pesan di bawah input, `role="alert"`; slot ber-border `--destructive`; isi dikosongkan dan fokus kembali ke slot 1. Tanpa animasi goyang. |
| Sukses | Pesan "Berhasil masuk" lalu redirect ke `/` (halaman tujuan sebenarnya, mis. dashboard, di luar cakupan). |

### 5.4 State & pesan

Copy final menyesuaikan bahasa (§12). Semua state harus bisa dipicu lewat mock (§6.2) agar bisa direview.

| State | Pesan |
|---|---|
| Email tidak valid | "Masukkan alamat email yang valid." |
| Mengirim | tombol "Mengirim…", field dikunci |
| Kode terkirim | pindah ke langkah 2, tanpa toast |
| Memverifikasi | slot dikunci, tombol "Memeriksa…" |
| Kode salah | "Kode salah. Sisa N percobaan." |
| Kode kedaluwarsa / percobaan habis | "Kode tidak berlaku lagi. Minta kode baru." (tombol kirim ulang langsung aktif) |
| Terlalu sering | "Terlalu banyak percobaan. Coba lagi dalam M menit." |
| Gangguan | "Kode belum bisa dikirim. Coba lagi sebentar lagi." |
| Offline | "Tidak ada koneksi internet." (`navigator.onLine`) |
| Sukses | "Berhasil masuk." |

---

## 6. Data mockup

### 6.1 Data landing

Satu file data statis per fitur, sesuai aturan "large static data in its own data file":

`src/components/landing/landing-mock-data.ts`, berisi dan mengekspor:

| Ekspor | Bentuk | Jumlah |
|---|---|---|
| `mockProviders` | `{ id, name, icon }`, `icon` = id file LobeHub di `public/models/` (§7.3), mis. `"anthropic"` | 10 |
| `mockModels` | `{ id, name, providerId, icon, contextTokens, inputPerMTokMicros, outputPerMTokMicros, capabilities[] }` | 10–12 |
| `mockRequestLogs` | `{ time, status, modelId, tokens, costMicros }` | 8 baris |
| `mockCodeSamples` | `{ lang: "curl" \| "python" \| "ts", code }` dengan base URL contoh `https://api.example.com/v1` | 3 |
| `mockFallback` | dua baris `{ provider, status, note }` | 2 |
| `mockBudget` | `{ keyName, usedMicros, limitMicros }` | 2–3 |
| `mockPlans` (opsional) | `{ name, priceMicros, features[] }` | 3 |
| `mockFaq` | `{ q, a }` | 5–8 |

Harga disimpan sebagai integer (mikro-dolar) dan diformat di `src/lib/price-format.ts`, supaya bentuk datanya sudah sama dengan data asli nanti dan tidak ada float di UI.

Nama model boleh memakai nama model nyata agar logo dan tampilan realistis, tetapi **semua angka (harga, konteks, log) adalah contoh**. Base URL memakai `example.com` (domain yang dicadangkan untuk contoh).

### 6.2 Mock login

`src/lib/auth-client.ts` mengekspor fungsi dengan bentuk yang nanti dipakai backend asli, tapi isinya simulasi:

| Fungsi | Perilaku mock |
|---|---|
| `requestOtp(email)` | jeda 600ms, lalu sukses `{ resendAfter: 60 }`. Email berakhiran `@limit.test` → state "Terlalu sering"; `@down.test` → state "Gangguan". |
| `verifyOtp(email, code)` | jeda 600ms. `12345678` → sukses; `00000000` → kedaluwarsa; kode lain → salah, sisa percobaan berkurang dari 5; percobaan habis → kedaluwarsa. |

Validasi format (email, 8 digit, pembersihan paste) ada di `src/lib/auth-contract.ts`, dipakai komponen sekarang dan bisa dipakai server nanti.

Komponen tidak memanggil `fetch` langsung (aturan arsitektur); saat backend siap, hanya isi `auth-client.ts` yang diganti. Tandai di kode: `// shortcut: mock tanpa server, ganti dengan fetch ke API saat backend dibuat`.

Kode mock `12345678` hanya ada di file mock; tampilkan petunjuk "Mode demo: kode 12345678" di bawah input **hanya** saat `process.env.NODE_ENV === "development"`.

### 6.3 Aturan data mockup

- Mockup hanya untuk UI produk (tabel, log, kode, daftar model). Tidak ada testimoni, logo pelanggan, atau klaim pemasaran palsu.
- Sebelum rilis publik, semua angka diganti data asli atau section-nya disembunyikan.

---

## 7. Peta aset gambar

Prinsip: **pakai SVG** (tajam di semua ukuran dan layar retina). Visual hero dan panel login dibangun dengan HTML, **bukan gambar**, jadi tidak perlu screenshot atau ilustrasi. Logo model/provider **tidak perlu dibuat sendiri**: diambil gratis dari LobeHub Icons (§7.3).

### 7.1 Struktur folder

```
src/app/
  favicon.ico                  (ganti yang sekarang, masih bawaan Next)
  icon.svg
  apple-icon.png
  opengraph-image.png
  opengraph-image.alt.txt
public/
  brand/
    logo-wordmark.svg          (dibuat owner/desainer)
    logo-mark.svg              (dibuat owner/desainer)
  models/                      (diunduh dari LobeHub, §7.3)
    openai.svg  anthropic.svg  claude.svg  google.svg  gemini.svg
    meta.svg    mistral.svg    deepseek.svg qwen.svg   moonshot.svg
    kimi.svg    zhipu.svg      chatglm.svg  xai.svg    grok.svg
```

File bawaan create-next-app di `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) dihapus saat implementasi jika tidak dipakai.

### 7.2 Aset brand (dibuat sendiri)

| File | Format | Ukuran kanvas | Tampil di layar | Catatan |
|---|---|---|---|---|
| `src/app/favicon.ico` | ICO berisi 16×16, 32×32, 48×48 | — | tab browser | Docs Next: `favicon.ico` hanya di root `app/` |
| `src/app/icon.svg` | SVG | viewBox persegi, mis. `0 0 32 32` | tab browser modern | Next memberi `sizes="any"` untuk SVG (docs `app-icons.md`). Boleh pakai `@media (prefers-color-scheme: dark)` di dalam SVG. |
| `src/app/apple-icon.png` | PNG, tanpa transparansi | 180×180 | ikon layar utama iOS | Ukuran 180×180 adalah konvensi Apple, bukan dari docs Next. Beri latar penuh (iOS mengisi transparan dengan hitam). |
| `src/app/opengraph-image.png` | PNG (atau JPG) | 1200×630 | pratinjau link di sosmed/chat | Docs Next: maks. 8MB (build gagal jika lebih); target < 300KB. Isi: logo + headline, area aman 80px dari tepi. |
| `src/app/opengraph-image.alt.txt` | teks | — | — | Deskripsi gambar OG untuk aksesibilitas |
| `public/brand/logo-wordmark.svg` | SVG | tinggi viewBox 24, lebar mengikuti | header 20–24px tinggi, footer 20px | Warna `currentColor`. Teks diubah jadi path (outline). |
| `public/brand/logo-mark.svg` | SVG | viewBox persegi `0 0 32 32` | header mobile, panel login | `currentColor` |

### 7.3 Logo model & provider: LobeHub Icons

Sumber: [lobehub.com/icons](https://lobehub.com/icons) (contoh: [lobehub.com/icons/gemini](https://lobehub.com/icons/gemini)), panduan resmi [lobehub.com/icons/skill.md](https://lobehub.com/icons/skill.md) (dialihkan ke `lobehub.com/only-ai/skills/icons`), repo [github.com/lobehub/lobe-icons](https://github.com/lobehub/lobe-icons). Diperiksa 2026-11-08.

**Yang sudah diverifikasi**

| Hal | Hasil |
|---|---|
| Koleksi | 200+ logo brand AI/LLM (menurut skill.md) |
| Lisensi | MIT (README repo dan field `license` di npm untuk keempat paket di bawah) |
| Paket statis | `@lobehub/icons-static-svg` v1.102.0 (2.5MB), `@lobehub/icons-static-png` v2.6.0, `@lobehub/icons-static-webp` v2.6.0; semua diperbarui 2026-11-06 |
| Paket React | `@lobehub/icons` v6.15.0, MIT, butuh peer dependency `@lobehub/ui ^6`, unpacked 10MB |
| Format SVG mono | `viewBox="0 0 24 24"`, `fill="currentColor"`, `width/height="1em"`, ada `<title>` (dicek di `openai.svg`) |
| Format SVG color | warna brand tertanam di file (dicek di `gemini-color.svg`) |
| PNG / WebP | 640×640 px, versi `light/` dan `dark/` (dicek `gemini-color`: PNG 19.3KB, WebP 15.7KB) |
| Pola URL | `https://unpkg.com/@lobehub/icons-static-svg@<versi>/icons/{id}.svg`; varian `{id}-color.svg`, `{id}-text.svg` |

**Keputusan untuk proyek ini**

| Opsi | Dipakai? | Alasan |
|---|---|---|
| SVG **mono** dari `@lobehub/icons-static-svg`, diunduh sekali ke `public/models/` | **Ya** | Tanpa dependensi npm, tanpa request ke CDN pihak ketiga saat runtime, ikut warna tema, cocok dengan palet satu aksen (§3.3) |
| Paket React `@lobehub/icons` | Tidak | Menambah peer dependency `@lobehub/ui` dan 10MB paket hanya untuk ikon yang bisa disajikan sebagai file statis |
| Hotlink CDN (unpkg/GitHub raw) | Tidak | Bergantung ketersediaan pihak ketiga, menambah koneksi ke domain lain |
| SVG **color** | Tidak di UI | Warna brand campur-aduk melanggar prinsip satu aksen; boleh hanya bila owner minta |
| PNG/WebP 640×640 | Tidak di UI | SVG lebih kecil dan tajam; raster hanya bila suatu saat dibutuhkan konteks non-browser (mis. email) |

**Daftar file yang diunduh** (semua varian mono di bawah sudah dicek ada, HTTP 200, di v1.102.0):

| Provider | Ikon provider (`public/models/`) | Ikon model (`public/models/`) | Varian color tersedia? |
|---|---|---|---|
| OpenAI | `openai.svg` | `openai.svg` | tidak |
| Anthropic | `anthropic.svg` | `claude.svg` | claude: ya; anthropic: tidak |
| Google | `google.svg` | `gemini.svg` | ya |
| Meta | `meta.svg` | `meta.svg` | ya |
| Mistral AI | `mistral.svg` | `mistral.svg` | ya |
| DeepSeek | `deepseek.svg` | `deepseek.svg` | ya |
| Alibaba Qwen | `qwen.svg` | `qwen.svg` | ya |
| Moonshot AI | `moonshot.svg` | `kimi.svg` | kimi: ya; moonshot: tidak |
| Zhipu AI | `zhipu.svg` | `chatglm.svg` | ya |
| xAI | `xai.svg` | `grok.svg` | tidak |

Daftar ini **mockup**; provider yang benar-benar didukung ditentukan owner. Ikon lain dicari di lobehub.com/icons; `{id}` = id huruf kecil di URL halaman ikon.

**Cara mengunduh** (dijalankan sekali saat implementasi, versi dikunci supaya hasilnya sama):

```bash
v=1.102.0; mkdir -p public/models; for id in openai anthropic claude google gemini meta mistral deepseek qwen moonshot kimi zhipu chatglm xai grok; do curl -fsSL "https://unpkg.com/@lobehub/icons-static-svg@$v/icons/$id.svg" -o "public/models/$id.svg"; done
```

Setelah diunduh: buka beberapa file untuk memastikan isinya SVG (bukan halaman error), dan jangan ubah path di dalamnya.

**Cara menampilkan (penting untuk dark mode)**

SVG yang dimuat lewat `<img>` atau `next/image` **tidak** mewarisi `currentColor` dari halaman (gambar dirender sebagai dokumen terpisah), sehingga logo mono akan selalu hitam dan hilang di dark mode. Karena itu logo ditampilkan dengan **CSS mask**:

- Satu komponen kecil `src/components/provider-logo.tsx` (dipakai landing dan login, jadi di level `components/`): elemen `<span role="img" aria-label="OpenAI">` dengan `background-color: currentColor` dan `mask: url(/models/openai.svg) center / contain no-repeat`.
- Warna logo = warna teks induknya (`--foreground` atau `--muted-foreground`), otomatis benar di light & dark.
- Ukuran lewat `size-5` (20px), `size-6` (24px), `size-10` (40px) sesuai §3.5.
- Tanpa SVGR atau loader tambahan.

**Merek dagang:** lisensi MIT berlaku untuk koleksi file ikonnya; logo tetap merek dagang pemilik masing-masing. Pakai hanya untuk menunjukkan model/provider yang tersedia, jangan diubah bentuknya, dan jangan dipakai untuk menyiratkan kemitraan. Kepatuhan terhadap aturan merek tiap provider **belum dibuktikan**.

---

## 8. Lokasi file frontend (sesuai `.claude/rules/architecture.md`)

```
src/
  app/
    layout.tsx                              font + metadata (diubah)
    globals.css                             token warna, radius, font (diubah)
    page.tsx                                landing (tipis, merangkai komponen)
    (auth)/login/page.tsx                   halaman masuk
  components/
    landing/                                site-header, site-footer, hero, request-log-view,
                                            model-table, code-tabs, feature-*, faq, landing-mock-data.ts
    auth/                                   login-form (client), email-step, otp-step
    provider-logo.tsx                       logo model/provider via CSS mask (dipakai landing & login, §7.3)
    ui/                                     shadcn: button (ada), input, label, input-otp, sheet, accordion, tabs
  lib/
    auth-contract.ts                        validasi email / kode 8 digit / pembersih paste
    auth-client.ts                          mock requestOtp / verifyOtp (§6.2)
    price-format.ts                         format mikro-dolar → teks
```

Nama komponen di atas adalah usulan; dicek ulang terhadap batas ukuran file (≤ 200 baris target) saat implementasi.

---

## 9. Responsif

Diuji di lebar: 360, 390, 430 (ponsel), 768, 834 (tablet), 1024, 1280, 1440, 1920 (desktop), plus orientasi landscape ponsel (844×390).

| Komponen | <640 | 640–1023 | ≥1024 | ≥1536 |
|---|---|---|---|---|
| Header | logo + primer + menu sheet | sama | nav penuh | sama, konten tetap 1200px |
| Hero | 1 kolom, panel log di bawah CTA (kolom biaya disembunyikan) | 1 kolom | 2 kolom 6/6 | sama |
| Tabel model | daftar baris | tabel | tabel | tabel |
| Grid logo provider | 4 kolom | 5 kolom | 5 kolom | 5 kolom |
| Blok kode | scroll horizontal di dalam blok saja | sama | 2 kolom (teks/kode) | sama |
| Login | 1 kolom | 1 kolom, form 400px di tengah | 2 kolom | sama, form tidak melebar |
| Slot OTP | 36×48, gap 4 | 48×56, gap 8 | 48×56 | 48×56 |

Aturan: tidak ada scroll horizontal halaman di lebar mana pun ≥ 320px; target sentuh ≥ 44×44px di layar sentuh; teks tidak di bawah 14px di mobile (kecuali label eyebrow 12px); `env(safe-area-inset-*)` untuk header sticky di iOS; zoom 200% tetap terbaca.

---

## 10. Aksesibilitas (WCAG 2.2 AA)

- Semua field punya `<label>` terlihat; error terhubung lewat `aria-describedby`, diumumkan `role="alert"`.
- Navigasi keyboard penuh: Tab urut logis, fokus terlihat, skip link "Lewati ke konten".
- Perubahan langkah login memindahkan fokus ke judul langkah baru.
- Input OTP: satu input asli (bukan 8 input terpisah), sehingga autofill `one-time-code` dan pembaca layar bekerja.
- Logo provider (`provider-logo.tsx`): `role="img"` + `aria-label` = nama provider; jika nama sudah tertulis di sebelahnya, pakai `aria-hidden="true"` tanpa label. Di mode `forced-colors`, mask tetap terlihat karena memakai `currentColor` (cek saat QA).
- Kontras sesuai §3.3; status tidak hanya disampaikan dengan warna (selalu ada teks).
- `prefers-reduced-motion` dan `forced-colors` dihormati.
- Satu `h1` per halaman.

---

## 11. Performa & kriteria penerimaan

**Performa**
- Landing statis; JS klien hanya untuk menu mobile, tab kode, salin, filter tabel, FAQ, fade-in.
- Font via `next/font` (self-host), maks. 3 keluarga variable.
- Logo SVG kecil; tanpa gambar raster di hero.
- Tanpa library animasi tambahan.

**Landing**
- [ ] Lolos daftar anti-slop §3.7.
- [ ] Padding section dan gutter sesuai §3.4 di 360 / 768 / 1280px.
- [ ] Tidak ada scroll horizontal di 320–1920px.
- [ ] Dengan JS dimatikan, semua konten terlihat.
- [ ] `prefers-reduced-motion` mematikan fade.
- [ ] Light dan dark mode rapi, logo ikut warna tema.
- [ ] LCP, CLS, INP sesuai §1 di build produksi.

**Login (mock)**
- [ ] Semua state di §5.4 bisa dipicu lewat aturan mock §6.2.
- [ ] Paste "1234-5678" mengisi 8 slot dan auto-submit.
- [ ] Slot OTP muat tanpa terpotong di lebar 320px dan 360px.
- [ ] Fokus pindah ke judul saat ganti langkah; error dibacakan pembaca layar.
- [ ] Hitung mundur kirim ulang 60 s berjalan dan tombol aktif setelahnya.
- [ ] Petunjuk "Mode demo" tidak muncul di build produksi.
- [ ] Autofill kode di iOS/Android: **belum dibuktikan** (perlu email asli dari backend; diuji setelah backend ada).

**Kualitas kode**
- [ ] Unit test kecil untuk `auth-contract.ts` (validasi email, pembersih paste, 8 digit) dan `price-format.ts`.
- [ ] `npx tsc --noEmit` dan `npm run lint` lolos.
- [ ] Batas ukuran file/fungsi `.claude/rules/architecture.md` dipatuhi.
- [ ] `npm run map` dijalankan setelah struktur berubah.

**Urutan kerja**
1. Token: font (`layout.tsx`), warna & radius (`globals.css`), hapus Geist.
2. Tambah primitif shadcn: `input`, `label`, `input-otp`, `sheet`, `accordion`, `tabs`.
3. Unduh 15 logo mono LobeHub ke `public/models/` (perintah di §7.3); aset brand §7.2 menyusul (sementara boleh wordmark teks).
4. Landing: header/footer → hero → model → cara pakai → fitur → FAQ → CTA, dengan mock §6.1.
5. Login `/login` dengan mock §6.2.
6. QA: responsif §9, a11y §10, kriteria di atas.

---

## 12. Keputusan yang dibutuhkan dari owner

1. Nama produk, logo, domain.
2. Bahasa situs: Indonesia, Inggris, atau dua bahasa.
3. Konfirmasi font (§3.2) dan aksen lime (§3.3), atau pilih cadangan.
4. Daftar provider/model yang ditampilkan (§7.3) dan apakah section Harga ikut ditampilkan.
5. Teks "Belum punya akun? Kode yang sama membuat akun baru." tetap, atau pendaftaran lewat undangan.

---

## 13. Di luar cakupan (fase berikutnya)

Backend dan semua yang berhubungan dengan server: API route, database & skema, pembuatan dan pengiriman kode OTP, rate limit, sesi & cookie, `proxy.ts`, keamanan server, analitik. Juga: dashboard, manajemen API key, billing, docs site, OAuth, 2FA/passkey, i18n routing. Draft v1 dokumen ini sempat memuat rancangan backend; bagian itu dihapus atas permintaan owner dan akan dibuat sebagai PRD terpisah.

---

## 14. Sumber & bukti

| Sumber | Cara | Status |
|---|---|---|
| https://jatevo.ai/ dan `/app/login` | Browser Pencil: screenshot desktop 1129px & mobile 390px, computed style, CSS custom properties, keyframes, media queries | Terbukti (2026-11-08) |
| https://www.experientiallabs.ai/ dan `platform.experientiallabs.ai/signin` | Browser Pencil: screenshot desktop, computed style, layout vars, keyframes | Terbukti; langkah setelah email di signin **belum dibuktikan** |
| Next.js 16.4.5 docs terpasang | `01-getting-started/13-fonts.md`, `03-api-reference/02-components/image.md`, `03-api-reference/03-file-conventions/01-metadata/app-icons.md`, `opengraph-image.md` | Terbukti |
| Ketersediaan font | `font-data.json` di `next/font` terpasang | Terbukti |
| shadcn `input-otp` base-nova | `npx shadcn@latest view input-otp` | Terbukti (dependensi `input-otp`, `cn`) |
| Breakpoint Tailwind | `node_modules/tailwindcss/theme.css` | Terbukti |
| Kondisi proyek | `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `components.json`, isi `public/` dan `src/app/` | Terbukti |
| Ukuran apple-icon 180×180 | Konvensi Apple, tidak tertulis di docs Next | Konvensi umum, tidak diverifikasi di sumber Apple dalam sesi ini |
| Rasio kontras token warna | — | **Belum dibuktikan** (uji saat implementasi) |
| LobeHub Icons | Halaman `lobehub.com/icons/skill.md` dibaca lewat browser Pencil; `npm view` untuk versi/lisensi/dependensi 4 paket; `curl` ke unpkg untuk cek 15 file mono + varian color; isi `openai.svg` & `gemini-color.svg`; ukuran PNG/WebP `gemini-color`; README repo (MIT) | Terbukti (2026-11-08) |
| Kepatuhan aturan merek dagang tiap provider | — | **Belum dibuktikan** |
