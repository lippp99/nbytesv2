# PRD: Admin Console · Login OTP 10 digit + TOTP (AI Gateway)

| | |
|---|---|
| Status | Draft v1, fase frontend (UI/UX & visual) dengan **data mockup** |
| Tanggal | 2026-11-08 |
| Repo | `nbytesv2` (branch `develop`) |
| Cakupan fase ini | Halaman masuk admin (email → kode email 10 digit → TOTP 6 digit) dan 8 halaman admin, semua dengan mock |
| Di luar cakupan fase ini | API, database, pengiriman email, sesi, penyimpanan secret TOTP, enforcement role di server (§10) |

Hal yang tidak bisa dibuktikan dari repo ditandai **belum dibuktikan**.

---

## 1. Tujuan

1. Tim internal bisa memantau kesehatan gateway (traffic, error, provider upstream, pendapatan) dari satu tempat.
2. Tim internal bisa mengatur hal yang memengaruhi pengguna: akun, model dan harga, kredit/tagihan, pengaturan platform.
3. Akses admin dilindungi dua faktor: kode sekali pakai 10 digit lewat email **dan** TOTP dari aplikasi authenticator.
4. Setiap aksi admin tercatat (audit log) dan bisa ditelusuri.

### Pengguna

| Peran | Bisa |
|---|---|
| Owner | Semua, termasuk menambah/mencabut admin dan mengubah pengaturan platform |
| Admin | Kelola pengguna, model, harga, kredit; lihat semua halaman pantau |
| Support | Lihat (read-only) pengguna, request log, tagihan; tidak bisa mengubah harga atau pengaturan |

Pembatasan per peran hanya ditampilkan di UI fase ini; penegakannya wajib di server (fase backend).

---

## 2. Login admin (`/admin/login`)

Terpisah dari `/login` pengguna. Tampilan memakai token dashboard (`data-app`), bukan gaya landing.

### 2.1 Alur

| Langkah | Isi | Aturan |
|---|---|---|
| 1. Email | Field email kerja | Validasi format di klien dan server. Respons **selalu** "kode dikirim bila email terdaftar sebagai admin" (tidak membocorkan siapa admin). |
| 2. Kode email | 10 digit, dua grup 5-5, paste `12345-67890` diterima | Berlaku 10 menit, maks 5 percobaan, kirim ulang setelah 60 detik. |
| 3. TOTP | 6 digit dari authenticator (RFC 6238, SHA-1, 30 detik) | Toleransi ±1 langkah waktu. Kode yang sudah dipakai ditolak (anti-replay). Maks 5 percobaan lalu kembali ke langkah 1. |
| Selesai | Masuk ke `/admin` | Sesi admin 8 jam, idle timeout 30 menit (fase backend). |

Urutan email dulu lalu TOTP: kode email membuktikan akses ke inbox, TOTP membuktikan perangkat. Keduanya wajib.

### 2.2 Pendaftaran TOTP (fase backend, UI menyusul)

- Admin baru diundang owner → login email pertama → layar setup: QR + secret teks, konfirmasi satu kode TOTP.
- Setelah aktif, tampil 10 kode cadangan sekali pakai (diunduh/disalin sekali, disimpan sebagai hash).
- Reset TOTP hanya oleh owner, tercatat di audit log.

### 2.3 State & pesan

| State | Pesan |
|---|---|
| Email tidak valid | "Masukkan alamat email yang valid." |
| Kode salah | "Kode salah. Sisa N percobaan." |
| Kode kedaluwarsa / percobaan habis | "Kode tidak berlaku lagi. Minta kode baru." |
| Rate limit | "Terlalu banyak percobaan. Coba lagi dalam N menit." |
| TOTP salah | "Kode authenticator salah. Sisa N percobaan." |
| Offline | "Tidak ada koneksi internet." |

### 2.4 Mock fase ini (`src/lib/admin-auth-client.ts`)

| Input | Hasil |
|---|---|
| Email apa pun yang valid | "terkirim" (`@limit.test` → rate limit) |
| Kode email `1234567890` | lanjut ke TOTP; `0000000000` → kedaluwarsa |
| TOTP `123456` | masuk |

Kode demo hanya tampil saat `NODE_ENV=development`.

---

## 3. Menu admin

Navigasi dikelompokkan menjadi 3 grup. URL di bawah `/admin`.

| Grup | Menu | Route | Pantau | Atur |
|---|---|---|---|---|
| Pantau | Ringkasan | `/admin` | Pendapatan bulan ini, pengguna aktif, request 24 jam, error rate, status provider, peringatan terbaru | - |
| Pantau | Request log | `/admin/requests` | Request terbaru: waktu, pengguna, model, status, latensi, token, biaya | Filter status (fase ini: semua/berhasil/error) |
| Pantau | Provider | `/admin/providers` | Status upstream per provider: uptime, latensi p50, error rate | Aktif/nonaktifkan provider (routing fallback) |
| Kelola | Pengguna | `/admin/users` | Daftar akun: paket, saldo, pemakaian bulan ini, status | Cari, tangguhkan/aktifkan akun |
| Kelola | Model & harga | `/admin/models` | Biaya upstream, harga jual, markup dan margin per model, contoh hitungan | Markup default + per model, biaya top-up, aktif/nonaktifkan model (§3.2) |
| Kelola | Keuangan | `/admin/billing` | Pendapatan, top-up dan tagihan terbaru, status pembayaran | - (refund/kredit manual: fase berikutnya) |
| Keamanan | Admin & akses | `/admin/team` | Daftar admin, peran, status TOTP, login terakhir | Undang admin (UI saja) |
| Keamanan | Audit log | `/admin/audit` | Siapa melakukan apa, kapan, dari IP mana | - (read-only, tidak bisa dihapus) |
| Keamanan | Pengaturan | `/admin/settings` | - | Pendaftaran baru on/off, banner maintenance, rate limit default, kebijakan sesi |

### 3.1 Prioritas data per halaman

- Ringkasan: angka utama dalam satu kartu ringkasan (pola `StatSummary`), lalu tabel status provider dan daftar peringatan. Tabel, bukan grid kartu.
- Semua tabel: kolom angka rata kanan, tabular; status selalu badge dengan titik + kata (tidak warna saja).
- Aksi berisiko (tangguhkan akun, nonaktifkan model/provider, maintenance) meminta konfirmasi dan tercatat di audit log (fase backend).

### 3.2 Margin: sumber dan hitungan (halaman Model & harga)

| Sumber margin | Cara kerja |
|---|---|
| Markup token (utama) | Harga jual per 1M token = biaya upstream × (1 + markup), dibulatkan **ke atas** ke sen terdekat |
| Biaya top-up | Persen dari setiap pembelian saldo (default 5%), sebagian habis untuk biaya kartu (~2,9%) |
| Diskon provider | Harga upstream turun karena volume/kontrak, harga jual tetap → margin naik |
| Paket bulanan | Biaya langganan Pro/Tim di luar token |

Rumus (semua integer: micro-dollar dan basis point, tanpa float):

- Biaya request = token_input × biaya_input/1M + token_output × biaya_output/1M
- Pendapatan request = token_input × harga_input/1M + token_output × harga_output/1M
- Laba kotor = pendapatan − biaya; **margin** = laba ÷ pendapatan; **markup** = laba ÷ biaya
- Markup 10% = margin 9,1%. Laporan keuangan memakai margin, pengaturan harga memakai markup.
- Top-up $100 dengan biaya 5%: pengguna bayar $105, biaya kartu 2,9% × $105 = $3,05, sisa untuk nbytes $1,95.

Belum dihitung (fase berikutnya): request gagal yang tetap ditagih provider, retry/fallback ke model lain, selisih
kurs, cache prompt, biaya server. Perubahan harga wajib tercatat di audit log dan diumumkan ke pengguna sebelum berlaku.

---

## 4. Visual & layout

Mengikuti `.claude/rules/dashboard-design.md` (token `app-*`, font, radius, spasi), karena admin adalah alat kerja (mode Operate).

- Shell admin: sidebar satu tingkat 256px di `app-page` dengan judul grup dan item; label "Admin" di samping logo supaya
  tidak tertukar dengan dashboard pengguna. Di bawah `lg` sidebar menjadi drawer mengambang (pola sama dengan dashboard).
- Header 64px: tombol menu (mobile), nama halaman, badge "Data contoh", switch tema, identitas admin.
- Konten maks 1200px, padding 40px desktop / 20px mobile, halaman scroll di window.
- Tabel lebar menggulung ke samping di dalam kartunya sendiri saja; halaman tidak pernah scroll horizontal di 320–1920px.

## 5. Lokasi file (sesuai `architecture.md`)

| Apa | Lokasi |
|---|---|
| Route login | `src/app/admin/login/page.tsx` |
| Layout + halaman admin | `src/app/admin/(console)/layout.tsx`, `src/app/admin/(console)/<page>/page.tsx` |
| Komponen | `src/components/admin/{shell,shared,<page>}/` |
| Kit bersama dashboard + admin | `src/components/app-kit/` |
| Validasi login admin | `src/lib/admin-auth-contract.ts` (+ test) |
| Mock auth admin | `src/lib/admin-auth-client.ts` |

## 6. Aksesibilitas

WCAG 2.2 AA: fokus pindah ke judul langkah saat login berganti langkah, error diumumkan (`role="alert"`), input kode
punya label untuk pembaca layar, semua aksi bisa dengan keyboard, target sentuh ≥ 40px.

## 7. Kriteria penerimaan (fase frontend)

1. `/admin/login` menyelesaikan alur email → 10 digit → TOTP dengan mock dan mengarah ke `/admin`.
2. Kesembilan route admin tampil di 375px dan 1440px tanpa scroll horizontal halaman, light dan dark.
3. `npx tsc --noEmit`, `npm run lint`, dan test contract lolos.
4. Tidak ada perubahan pada landing, `/login` pengguna, atau token global.

## 8. Keamanan (wajib di fase backend)

- Kode email dan secret TOTP disimpan sebagai hash/terenkripsi, tidak pernah dilog.
- Rate limit per email dan per IP untuk kirim kode dan verifikasi.
- Semua route `/admin` dan API admin memeriksa sesi admin + peran di server, bukan hanya di UI.
- Cookie sesi `HttpOnly`, `Secure`, `SameSite=Strict`; login admin tidak berbagi sesi dengan login pengguna.
- Audit log append-only.

## 9. Keputusan yang dibutuhkan dari owner

1. Daftar peran final (Owner/Admin/Support) dan izin per halaman.
2. Domain email admin yang diizinkan (allowlist) atau undangan manual saja.
3. Durasi sesi dan idle timeout.
4. Apakah admin juga butuh IP allowlist.

## 10. Di luar cakupan (fase berikutnya)

Backend auth dan sesi, enrollment TOTP + kode cadangan, halaman detail pengguna, refund/kredit manual, ekspor CSV,
notifikasi peringatan (email/Slack), pengaturan routing per model.
