# PRD: Admin (konsol admin + backend auth: kode email 10 digit + TOTP)

| | |
|---|---|
| Status | Draft v4. Satu-satunya PRD admin: isi `PRD/admin-console.md` digabung ke sini (Lampiran A) dan berkas itu dihapus atas permintaan owner (2026-11-11). C1–C4, C7 dan C9 (Owner tunggal, tanpa tim dan tanpa peran) disetujui; terbuka: C5, C8 (§15). |
| Tanggal | 2026-11-11 (spesifikasi UI di Lampiran A berasal dari 2026-11-08) |
| Repo | `nbytesv2` (branch `develop`), Next 16.4.5, `cacheComponents: true`, Node `node:crypto` |
| Dasar | Lampiran A (spesifikasi konsol admin dan aturan login awal), `PRD/backend-auth-user.md` (backend auth pengguna yang sudah jadi) |
| Cakupan | Bagian utama: akun admin, login 3 langkah (email → kode email 10 digit → TOTP 6 digit), pendaftaran TOTP, kode cadangan, sesi admin, proteksi `/admin` dan API admin, audit, pemulihan. Satu admin saja: Owner (C9). Lampiran A: menu, tampilan, margin, aksesibilitas dan kriteria UI konsol admin. |
| Di luar cakupan | Isi endpoint admin per halaman (harga, kurs, pengguna, dll.); daftar lain di Lampiran A.14 |

Yang tidak bisa dibuktikan ditandai **belum dibuktikan**; bagian **usulan** bisa diganti owner. Fakta Next.js
merujuk ke docs terpasang (§16).

---

## 1. Ringkasan dan jawaban owner

- **Ya, kode email admin 10 digit** (bukan 8 seperti pengguna): sudah ada di `ADMIN_OTP_LENGTH = 10` dan di UI
  ("Kode 10 digit", dua grup 5-5, paste `12345-67890` diterima). Ini **satu kode berisi 10 angka**, bukan 10 kode.
- **Ya, TOTP wajib** untuk semua admin, 6 digit dari aplikasi authenticator (`TOTP_LENGTH = 6`). Keduanya wajib:
  kode email membuktikan akses ke inbox, TOTP membuktikan perangkat (Lampiran A.2).
- Yang berjumlah 10 adalah **kode cadangan** TOTP: 10 kode sekali pakai yang diberikan setelah TOTP aktif (§6).

## 2. Kondisi saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Login admin | **Mock penuh tanpa server**: email apa pun "terkirim", kode `1234567890`, TOTP `123456` | `src/lib/admin-auth/admin-auth-client.ts` (komentar `shortcut: mock tanpa server`) |
| Kontrak | `ADMIN_OTP_LENGTH = 10`, `TOTP_LENGTH = 6`, `sanitizeDigits`, `isDigits` | `src/lib/admin-auth/admin-auth-contract.ts` |
| UI login | Kartu 3 langkah (Email, Kode email, Authenticator), teks dan pesan error | `src/components/admin/login/*`, `login-copy.ts` |
| **Halaman `/admin/*`** | **Tidak dilindungi.** Layout admin tidak memeriksa sesi; `src/proxy.ts` tidak mencakup `/admin` | `src/app/admin/(console)/layout.tsx`, `src/proxy.ts` (matcher) |
| Tabel admin | Belum ada. Skema hanya `users`, `otp_challenges`, `sessions`, `auth_rate_limits`, `auth_events` | `src/lib/server/db/schema/auth.ts` |
| Bisa dipakai ulang | OTP berbasis `purpose` (`issueChallenge`, `consumeChallenge` dengan kunci baris), `hmac`, `sha256`, `equalHex`, `randomToken`, rate limit DB (`hit`, `enforceLimit`), mailer SMTP, `AppError` | `src/lib/server/auth/otp/challenge.ts`, `crypto.ts`, `rate-limit.ts`, `otp/mailer.ts`, `src/lib/server/errors.ts` |
| Generator kode | `randomOtp()` hanya membuat 8 digit (`OTP_DIGITS`) | `src/lib/server/auth/crypto.ts` |
| Peran | (Sebelum C9) mock halaman Admin & akses dengan Owner, Admin, Support dan 4 admin contoh. Dihapus 2026-11-11 (C9). | git `e0f0dfa` |
| Dependensi | Tidak ada library TOTP, base32, atau QR code | `package.json` |

**Risiko saat ini:** siapa pun yang membuka `/admin` melihat konsol (saat ini berisi data mock). Bila aplikasi sudah
dijalankan di server publik, halaman itu terbuka: **belum dibuktikan** apakah sudah terpasang di server.

## 3. Prinsip

1. Admin **terpisah total** dari pengguna: tabel akun, tabel sesi, cookie, dan endpoint sendiri
   (Lampiran A.6: "login admin tidak berbagi sesi dengan login pengguna").
2. Tidak ada pendaftaran admin terbuka. Satu-satunya admin adalah Owner, dibuat dari server (§9). Tidak ada tim,
   undangan, atau peran (C9).
3. Semua pemeriksaan di server; UI hanya tampilan.
4. Tanpa dependensi baru kecuali QR code (keputusan C2). TOTP, base32 dan enkripsi memakai `node:crypto`.

## 4. Alur login

| Langkah | Server | Aturan |
|---|---|---|
| 1. Email | Bila email adalah admin `active`: buat kode 10 digit, kirim email. Selain itu: tidak kirim apa pun. | Respons **selalu sama** (`202`), tidak membocorkan siapa admin (Lampiran A.2). |
| 2. Kode email | Cocokkan kode. Benar → buat **tiket login** sementara (cookie terpisah, 10 menit, terikat ke admin itu) dan balas apakah langkah berikut "TOTP" atau "pendaftaran TOTP". | 10 digit, berlaku 10 menit, maks 5 percobaan, kirim ulang setelah 60 detik (Lampiran A.2). |
| 3. TOTP | Dengan tiket valid: cocokkan TOTP (atau kode cadangan). Benar → hapus tiket, buat sesi admin. | ±1 langkah waktu, kode yang sudah dipakai ditolak, maks 5 percobaan per tiket lalu tiket hangus dan kembali ke langkah 1 (Lampiran A.2). |

Tiket login menjamin langkah 3 hanya bisa dicoba setelah langkah 2 lulus di browser yang sama. Isi cookie tiket:
token acak; di DB hanya `sha256(token)`, admin, jumlah percobaan TOTP, kedaluwarsa.

## 5. Kode email 10 digit

| Aturan | Nilai |
|---|---|
| Pembuatan | `crypto.randomInt(0, 10 ** 10)` lalu `padStart(10, "0")`. Dicek di Node terpasang: rentang ini diterima `randomInt`. Generator 8 digit yang ada tidak dipakai. |
| Penyimpanan | Tabel `otp_challenges` yang sudah ada, `purpose = "admin-login"`; hash `hmac(AUTH_OTP_PEPPER, "admin-login:" + email + ":" + kode)` (pola `otpHash` yang ada, prefix tujuan memisahkan dari kode pengguna). |
| Perbandingan | `equalHex` (waktu-konstan), baris dikunci `FOR UPDATE` (pola `consumeChallenge`). |
| Masa berlaku / percobaan / kirim ulang | 10 menit / 5 / 60 detik. Kode baru membatalkan kode lama. |
| Email | Mailer SMTP yang ada, jenis baru `admin_login`. Subjek tanpa angka kode. Kode ditulis `12345-67890` (sama dengan UI). Tanpa link login. |
| Log | Kode tidak pernah dicatat (kecuali mode `console` saat development, seperti pengguna). |

## 6. TOTP

| Aturan | Nilai | Sumber |
|---|---|---|
| Algoritma | RFC 6238: HMAC-SHA1, langkah 30 detik, 6 digit | Lampiran A.2 |
| Toleransi | Langkah sekarang ±1 | Lampiran A.2 |
| Anti-replay | Simpan nomor langkah terakhir yang berhasil per admin; kode dengan langkah ≤ itu ditolak | Lampiran A.2 ("kode yang sudah dipakai ditolak") |
| Secret | 20 byte acak (`crypto.randomBytes`), ditampilkan sebagai base32 | usulan; 160 bit adalah panjang yang direkomendasikan RFC 4226 untuk secret HOTP/TOTP |
| Penyimpanan secret | **Terenkripsi**, bukan hash (server butuh secret asli untuk menghitung kode): AES-256-GCM dengan kunci env `ADMIN_TOTP_KEY` (32 byte), IV acak per secret | Lampiran A.6 ("hash/terenkripsi") |
| Kode cadangan | 10 kode sekali pakai, ditampilkan **sekali** setelah TOTP aktif, disimpan sebagai `hmac(AUTH_HASH_KEY, kode)`. Format: 10 karakter huruf/angka tanpa karakter mirip (0/O, 1/l), dikelompokkan 5-5 (C7) | Lampiran A.3 (jumlah 10, sekali pakai, hash) |
| Implementasi | Ditulis sendiri dengan `node:crypto` (`createHmac("sha1")`, `createCipheriv("aes-256-gcm")`), base32 ditulis tangan, **wajib unit test dengan vektor uji RFC 6238 lampiran B** | aturan proyek: modul murni + test |

Tidak ada library TOTP; acuan langsung RFC 6238 dan RFC 4226 (§16).

## 7. Pendaftaran TOTP (login pertama Owner)

1. Skrip §9 membuat baris Owner dengan status `invited` dan TOTP `pending`.
2. Owner login langkah 1–2 seperti biasa. Server melihat TOTP `pending` → langkah 3 menjadi **pendaftaran**:
   secret baru ditampilkan sebagai teks base32, link `otpauth://totp/nbytes%20Admin:<email>?secret=…&issuer=nbytes%20Admin`,
   dan QR code (C2).
3. Admin memasukkan satu kode dari aplikasi → benar → secret disimpan, status TOTP `on`, 10 kode cadangan ditampilkan
   sekali, lalu sesi dibuat.
4. Secret yang belum dikonfirmasi hanya hidup selama tiket login (10 menit) dan tidak disimpan permanen.
5. Baris dari skrip kedaluwarsa 72 jam (C4) bila pendaftaran belum selesai; menjalankan skrip lagi memperpanjangnya.
6. Reset TOTP dari konsol tidak ada (C9). Pemulihan bila HP dan semua kode cadangan hilang: **belum diputuskan**
   (owner, 2026-11-11: "tidak sekarang").

## 8. Sesi admin

| Aturan | Nilai | Sumber |
|---|---|---|
| Umur absolut / idle | 8 jam / 30 menit | Lampiran A.2 |
| Token | `randomToken()` (32 byte), di DB hanya `sha256` | pola sesi pengguna |
| Cookie | `__Host-nb_admin_session` (`nb_admin_session` saat development), `HttpOnly`, `Secure` (produksi), `SameSite=Strict`, `Path=/` | Lampiran A.6; nama: usulan, mengikuti pola `sessionCookieName()` |
| Perpanjangan idle | `last_seen_at` diperbarui paling sering 1×/menit (usulan; idle 30 menit butuh ketelitian lebih dari 1×/jam milik pengguna) | usulan |
| Ditolak bila | Tidak ada baris, kedaluwarsa, idle lewat, admin bukan `active`, atau TOTP belum terpasang | – |
| Logout | `POST`, hapus baris dan cookie | pola logout pengguna |
| Set/hapus cookie | Hanya di Route Handler atau Server Function | [N2] |

## 9. Akun Owner pertama

Tidak ada admin sama sekali saat awal. **Diputuskan (C1):** skrip server `npm run admin:create-owner -- <email>` yang
dijalankan owner langsung di server/DB lokal: membuat baris Owner (`invited`, TOTP `pending`, berlaku 72 jam). Tidak
ada endpoint web untuk ini. Skrip menolak bila sudah ada Owner aktif; baris `invited` untuk email lain (mis. salah
ketik) diganti, sehingga hanya ada satu Owner (C9).

## 10. Proteksi

**Owner tunggal (C9, owner 2026-11-11):** tidak ada tim dan tidak ada peran (Admin/Support dihapus). Admin yang masuk
adalah Owner dan boleh semua menu.

**Proteksi:**

- `src/proxy.ts`: tambah `/admin/:path*` **kecuali** `/admin/login`; tanpa cookie admin → redirect `/admin/login`.
  Hanya cek optimistik (ada/tidaknya cookie), seperti untuk pengguna [N3].
- Pemeriksaan utama di server: fungsi `getCurrentAdmin()` (DAL) di layout `src/app/admin/(console)/`, pola sama dengan
  `getCurrentUser()` di layout dashboard. Komponen yang membaca sesi berada di balik `<Suspense>`; membaca `cookies()` di
  luar boundary adalah build error saat Cache Components aktif [N1].
- Setiap route handler admin (selain login) membaca sesi admin dari DB tanpa cache (`readAdminSession()`), lalu baru
  validasi input. Tanpa sesi → `401`.
- Endpoint admin di `src/app/api/admin/...`, logika di `src/lib/server/admin-auth/` (`import "server-only"`). Kontrak
  bersama di `src/lib/admin-auth/admin-auth-contract.ts` yang sudah ada.

## 11. Rate limit dan penguncian

Memakai tabel dan fungsi rate limit yang ada, kunci berawalan `admin-`:

| Kunci | Batas | Sumber |
|---|---|---|
| Kirim kode per email | 1 per 60 detik, 5 per jam | sama dengan pengguna (`otp-rules.ts`) |
| Kirim kode per IP | 20 per jam | sama dengan pengguna |
| Verifikasi kode email per IP | 30 per jam | sama dengan pengguna |
| Percobaan TOTP | 5 per tiket login | Lampiran A.2 |
| TOTP gagal per admin | **Diputuskan (C3):** 10 per jam → login admin itu dikunci 1 jam dan Owner mendapat email | C3 |

Respons `429` memakai bentuk yang sudah dibaca UI (`rate_limited` + `retryAfterMinutes`, header `Retry-After`).

## 12. Endpoint

Semua `POST`, JSON ≤ 1 KB, cek Origin dan `Content-Type` dengan `readGuardedJson` yang ada, `Cache-Control: no-store`.
Format error sama dengan auth pengguna (`invalid_input`, `rate_limited`, `invalid` + `attemptsLeft`, `expired`,
`unavailable`).

| Endpoint | Isi | Butuh |
|---|---|---|
| `POST /api/admin/auth/code/request` | `{ email }` → `202 { resendAfter: 60 }` | – |
| `POST /api/admin/auth/code/verify` | `{ email, code }` → `200 { next: "totp" \| "enroll" }` + cookie tiket | – |
| `POST /api/admin/auth/totp/enroll` | Mulai pendaftaran → `{ secret, otpauthUrl }` | tiket, TOTP `pending` |
| `POST /api/admin/auth/totp/verify` | `{ code }` (TOTP atau kode cadangan) → `200` + cookie sesi; saat pendaftaran juga `{ backupCodes }` sekali | tiket |
| `POST /api/admin/auth/logout` | `303` ke `/admin/login` | sesi |

Endpoint tim (`/api/admin/team/*`: undang, ubah peran, nonaktifkan, reset TOTP) dihapus (C9).

**Perubahan UI yang dibutuhkan** (dikerjakan terpisah): mengganti `admin-auth-client.ts` mock dengan `fetch` ke
endpoint di atas; layar pendaftaran TOTP (secret, link, QR, konfirmasi, kode cadangan); tautan "Pakai kode cadangan"
di langkah TOTP; tombol logout admin. Halaman Admin & akses dihapus (C9).

## 13. Audit dan model data

**Audit (append-only, Lampiran A.6):** tabel `admin_audit_events`, aplikasi hanya `INSERT`. Usulan tambahan: trigger DB
yang menolak `UPDATE`/`DELETE` pada tabel itu. Dicatat minimal: kode dikirim, kode/TOTP gagal, login berhasil, logout,
pendaftaran TOTP, kode cadangan dipakai, Owner dibuat skrip (`invited`), penguncian. Email dan IP disimpan
sebagai HMAC (pola `auth_events`). Retensi: **belum diputuskan** (C5).

| Tabel | Kolom utama |
|---|---|
| `admins` | `id`, `email` (unik, dinormalisasi), `name`, `status` (`invited`/`active`, CHECK), `totp_secret_enc` (nullable), `totp_last_step` (nullable), `totp_enabled_at`, `invite_expires_at`, `locked_until` (C3), `last_login_at`, `created_at`. Kolom `role` dan `invited_by` dihapus (C9, migrasi `0006`). |
| `admin_backup_codes` | `admin_id` → `admins`, `code_hash`, `used_at` |
| `admin_login_tickets` | `token_hash` (unik), `admin_id`, `totp_attempts`, `pending_secret_enc` (pendaftaran), `expires_at` |
| `admin_sessions` | `token_hash` (unik), `admin_id`, `expires_at`, `last_seen_at`, `user_agent`, `created_at` |
| `admin_audit_events` | `id`, `admin_id` (nullable), `type`, `target`, `email_hash`, `ip_hash`, `created_at` |

`otp_challenges` dan `auth_rate_limits` yang ada dipakai bersama (dibedakan `purpose` dan awalan kunci). Indeks pada
setiap foreign key. Migrasi: `npm run db:generate` → tinjau SQL → `npm run db:migrate` ke DB lokal; non-lokal hanya
atas persetujuan owner.

**Env baru** (nama saja di `.env.example`): `ADMIN_TOTP_KEY` (32 byte base64). `AUTH_OTP_PEPPER` dan `AUTH_HASH_KEY`
yang ada dipakai ulang. Mengganti `ADMIN_TOTP_KEY` membuat semua secret TOTP tidak terbaca: semua admin harus
mendaftar ulang. Rotasi kunci tanpa itu **di luar cakupan** v1.

## 14. Keamanan (ringkas)

| Ancaman | Kontrol |
|---|---|
| Menebak siapa admin | Langkah 1 selalu `202` yang sama |
| Brute force kode email | 10^10 kemungkinan, 5 percobaan per kode, batas per IP |
| Brute force TOTP | Hanya bisa dicoba dengan tiket (setelah kode email lulus), 5 per tiket, kunci per admin (C3) |
| Kode TOTP dipakai ulang | Anti-replay `totp_last_step` |
| DB bocor | Kode dan token = hash; secret TOTP = AES-GCM dengan kunci di env (bukan di DB) |
| CSRF | Cek Origin, JSON wajib, `SameSite=Strict`, aksi berubah-state hanya `POST` |
| Baris Owner dari skrip dibajak | Kedaluwarsa 72 jam (C4); pendaftaran TOTP tercatat di audit |
| Kebocoran lewat log | Tidak mencatat kode, secret, token, email mentah |

## 15. Keputusan

Owner menyetujui semua usulan 2026-11-11 ("saya setuju semua"). C5 tidak punya usulan, jadi masih butuh jawaban. C6
gugur karena C9. C8 berasal dari daftar keputusan awal (Lampiran A.13).

| # | Pertanyaan | Keputusan |
|---|---|---|
| C1 | Cara membuat Owner pertama | **Diputuskan:** skrip server `npm run admin:create-owner -- <email>` (§9) |
| C2 | Tambah dependensi QR code untuk layar pendaftaran TOTP? | **Diputuskan:** ya, satu library QR, dipilih dan dicek lewat context7 saat implementasi |
| C3 | Kunci login admin setelah banyak TOTP gagal | **Diputuskan:** 10 gagal/jam → kunci 1 jam + email ke Owner |
| C4 | Masa berlaku undangan admin | **Diputuskan:** 72 jam (sejak C9: masa berlaku baris Owner dari skrip) |
| C5 | Retensi audit log admin | **Terbuka:** belum ada angka (kewajiban hukum **belum dibuktikan**) |
| C6 | Batasi email admin ke domain tertentu (mis. domain kantor)? | **Gugur (C9):** hanya ada satu Owner, dibuat lewat skrip. |
| C7 | Format kode cadangan | **Diputuskan:** 10 karakter huruf/angka, dikelompokkan 5-5 (§6) |
| C8 | IP allowlist untuk login admin? | **Terbuka.** Butuh hosting (A6 di `gateway-api.md`) untuk tahu IP klien tepercaya. |
| C9 | Tim admin dan peran? | **Diputuskan (owner, 2026-11-11):** tidak ada. Owner tunggal; endpoint tim, halaman Admin & akses, peran Admin/Support, kolom `role`/`invited_by` dan status `disabled` dihapus. Mockup Audit log dan Ringkasan hanya memakai satu Owner. |

## 16a. Detail implementasi yang sudah ditetapkan (agar tidak ditebak)

| Hal | Ketentuan |
|---|---|
| Status admin di langkah 1 | Kode dikirim hanya bila `status = active`, atau `status = invited` dan `invite_expires_at > now`. Kedaluwarsa atau sedang dikunci (C3) → tidak kirim apa pun, respons tetap `202`. |
| Status setelah pendaftaran | `invited` → `active` saat kode TOTP pertama benar (§7 butir 3). |
| Cookie tiket | `__Host-nb_admin_ticket` (`nb_admin_ticket` saat development), `HttpOnly`, `Secure` (produksi), `SameSite=Strict`, `Path=/`, umur 10 menit; dihapus saat sesi dibuat atau tiket hangus. |
| Email | Jenis baru di mailer yang ada: `admin_login` (kode 10 digit) dan `admin_locked` (ke Owner saat C3 terpicu). Bahasa Indonesia, tanpa link, subjek tanpa kode. |
| Env | `ADMIN_TOTP_KEY` ditambahkan ke pemeriksaan env saat server start (`auth-env.ts`, dipanggil `src/instrumentation.ts`) dan ke `.env.example` (nama saja, dengan cara membuat nilainya seperti env auth lain). |
| Skrip Owner pertama | Entri baru di `package.json` `scripts`: `admin:create-owner`. Paket `server-only` menolak dimuat di luar server React, jadi skrip **tidak boleh** mengimpor modul ber-`import "server-only"`; cara menjalankan dan mengakses DB diperiksa saat implementasi (bukan ditebak). |
| Pengujian | Unit test `node:test` untuk modul murni: TOTP (vektor RFC 6238), base32, enkripsi bolak-balik, aturan langkah/percobaan. Pola test yang ada: `*.test.ts` di samping modul. |

## 16. Sumber

- PRD: Lampiran A (dari `PRD/admin-console.md`, dihapus 2026-11-11; riwayatnya ada di git), `PRD/backend-auth-user.md`
  §5–§11.
- Kode: `src/lib/admin-auth/admin-auth-client.ts`, `admin-auth-contract.ts`, `src/components/admin/login/login-copy.ts`,
  `src/app/admin/(console)/layout.tsx`,
  `src/app/(dashboard)/layout.tsx`, `src/proxy.ts`, `src/lib/server/auth/crypto.ts`, `session.ts`, `auth-env.ts`,
  `otp/otp-rules.ts`, `otp/challenge.ts`, `otp/mailer.ts`, `src/lib/server/db/schema/auth.ts`, `.env.example`,
  `package.json`.
- Docs Next.js 16.4.5 terpasang (`node_modules/next/dist/docs/01-app/`):

| Kode | Berkas | Isi yang dipakai |
|---|---|---|
| N1 | `02-guides/authentication-with-cache-components.md` | Komponen yang membaca sesi harus di balik `<Suspense>`; `cookies()` di luar boundary = build error |
| N2 | `03-api-reference/04-functions/cookies.md` | `.set`/`.delete` cookie hanya di Server Function atau Route Handler |
| N3 | `02-guides/authentication.md` (dirujuk `PRD/backend-auth-user.md` §10.3) | Proxy hanya cek optimistik, pemeriksaan utama di DAL |

- Standar (diunduh dari rfc-editor.org 2026-11-11 dan dicek): RFC 4226 §4 ("MUST be at least 128 bits",
  merekomendasikan 160 bit untuk shared secret); RFC 6238 (contoh langkah waktu X = 30 detik, vektor uji di
  Lampiran B dengan secret ASCII `12345678901234567890`; vektor itu 8 digit, kode 6 digit = 6 digit terakhirnya).

---

## Lampiran A. Spesifikasi konsol admin (dari `PRD/admin-console.md`)

Isi lampiran ini dipindahkan dari `PRD/admin-console.md` (dibuat 2026-11-08 untuk fase frontend, diperbarui
2026-11-11) tanpa mengubah keputusannya. Yang sudah digantikan bagian utama dokumen ini ditandai.

### A.1 Tujuan dan peran

1. Owner bisa memantau kesehatan gateway (traffic, error, provider upstream, pendapatan) dari satu tempat.
2. Owner bisa mengatur hal yang memengaruhi pengguna: akun, model dan harga, kredit/tagihan, pengaturan platform.
3. Akses admin dilindungi dua faktor: kode sekali pakai 10 digit lewat email **dan** TOTP dari aplikasi authenticator.
4. Setiap aksi admin tercatat (audit log) dan bisa ditelusuri.

Tabel peran Owner/Admin/Support di sini digantikan C9 (owner, 2026-11-11): hanya ada satu admin, Owner, yang boleh
semua. Penegakan sesi di server: §10.

### A.2 Login admin (`/admin/login`): alur dan aturan

Terpisah dari `/login` pengguna. Tampilan memakai token dashboard (`data-app`), bukan gaya landing.

| Langkah | Isi | Aturan |
|---|---|---|
| 1. Email | Field email kerja | Validasi format di klien dan server. Respons **selalu** "kode dikirim bila email terdaftar sebagai admin" (tidak membocorkan siapa admin). |
| 2. Kode email | 10 digit, dua grup 5-5, paste `12345-67890` diterima | Berlaku 10 menit, maks 5 percobaan, kirim ulang setelah 60 detik. |
| 3. TOTP | 6 digit dari authenticator (RFC 6238, SHA-1, 30 detik) | Toleransi ±1 langkah waktu. Kode yang sudah dipakai ditolak (anti-replay). Maks 5 percobaan lalu kembali ke langkah 1. |
| Selesai | Masuk ke `/admin` | Sesi admin 8 jam, idle timeout 30 menit. |

Urutan email dulu lalu TOTP: kode email membuktikan akses ke inbox, TOTP membuktikan perangkat. Keduanya wajib.
Penerapan backend: §4–§8.

### A.3 Pendaftaran TOTP (aturan awal)

- Owner dibuat skrip (§9) → login email pertama → layar setup: QR + secret teks, konfirmasi satu kode TOTP.
- Setelah aktif, tampil 10 kode cadangan sekali pakai (diunduh/disalin sekali, disimpan sebagai hash).
- Reset TOTP oleh owner dari konsol: tidak ada sejak C9 (§7 butir 6).

Penerapan backend: §6–§7.

### A.4 State dan pesan login

| State | Pesan |
|---|---|
| Email tidak valid | "Masukkan alamat email yang valid." |
| Kode salah | "Kode salah. Sisa N percobaan." |
| Kode kedaluwarsa / percobaan habis | "Kode tidak berlaku lagi. Minta kode baru." |
| Rate limit | "Terlalu banyak percobaan. Coba lagi dalam N menit." |
| TOTP salah | "Kode authenticator salah. Sisa N percobaan." |
| Offline | "Tidak ada koneksi internet." |

### A.5 Mock frontend (`src/lib/admin-auth/admin-auth-client.ts`)

| Input | Hasil |
|---|---|
| Email apa pun yang valid | "terkirim" (`@limit.test` → rate limit) |
| Kode email `1234567890` | lanjut ke TOTP; `0000000000` → kedaluwarsa |
| TOTP `123456` | masuk |

Kode demo hanya tampil saat `NODE_ENV=development`. Mock ini diganti endpoint §12.

### A.6 Keamanan wajib (aturan awal)

- Kode email dan secret TOTP disimpan sebagai hash/terenkripsi, tidak pernah dilog.
- Rate limit per email dan per IP untuk kirim kode dan verifikasi.
- Semua route `/admin` dan API admin memeriksa sesi admin di server, bukan hanya di UI.
- Cookie sesi `HttpOnly`, `Secure`, `SameSite=Strict`; login admin tidak berbagi sesi dengan login pengguna.
- Audit log append-only.

Penerapan backend: §8, §10, §11, §13, §14.

### A.7 Menu admin

Navigasi dikelompokkan menjadi 3 grup. URL di bawah `/admin`.

| Grup | Menu | Route | Pantau | Atur |
|---|---|---|---|---|
| Pantau | Ringkasan | `/admin` | Pendapatan bulan ini, pengguna aktif, request 24 jam, error rate, status provider, peringatan terbaru | - |
| Pantau | Request log | `/admin/requests` | Request terbaru: waktu, pengguna, model, status, latensi, token, biaya | Filter status (fase ini: semua/berhasil/error) |
| Pantau | Provider | `/admin/providers` | Status upstream per provider: uptime, latensi p50, error rate | Aktif/nonaktifkan provider (routing fallback) |
| Kelola | Pengguna | `/admin/users` | Daftar akun: paket, saldo, pemakaian bulan ini, status | Cari, tangguhkan/aktifkan akun |
| Kelola | Model & harga | `/admin/models` | Biaya upstream, harga jual, markup dan margin per model, contoh hitungan | Markup default + per model, biaya top-up, aktif/nonaktifkan model (A.8) |
| Kelola | Keuangan | `/admin/billing` | Pendapatan, top-up dan tagihan terbaru, status pembayaran | - (refund/kredit manual: fase berikutnya) |
| Keamanan | Audit log | `/admin/audit` | Siapa melakukan apa, kapan, dari IP mana | - (read-only, tidak bisa dihapus) |
| Keamanan | Pengaturan | `/admin/settings` | - | Pendaftaran baru on/off, banner maintenance, rate limit default, kebijakan sesi |

Catatan: isi halaman Provider dan Model & harga akan berubah karena upstream Surplus (`PRD/ai-gateway.md` §6, D5).

Prioritas data per halaman:

- Ringkasan: angka utama dalam satu kartu ringkasan (pola `StatSummary`), lalu tabel status provider dan daftar
  peringatan. Tabel, bukan grid kartu.
- Semua tabel: kolom angka rata kanan, tabular; status selalu badge dengan titik + kata (tidak warna saja).
- Aksi berisiko (tangguhkan akun, nonaktifkan model/provider, maintenance) meminta konfirmasi dan tercatat di audit log.

### A.8 Margin: sumber dan hitungan (halaman Model & harga)

Mengikuti keputusan owner di `PRD/ai-gateway.md` (D2, D2a, D2b) dan `PRD/gateway-pricing-billing.md` (B3). Upstream
adalah Surplus Intelligence; biayanya berubah per request, jadi "biaya upstream tetap per model" di mock tidak lagi
menjadi dasar harga.

| Sumber margin | Cara kerja |
|---|---|
| Lantai diskon (utama) | Key Surplus nbytes memakai `min_discount_pct: 25`: Surplus hanya memilih penjual yang estimasi biayanya ≥ 25% di bawah harga list. Dengan harga jual = harga list, margin kotor per request diperkirakan ≥ 25% (tidak berlaku untuk embeddings) |
| Markup token | Harga jual per 1M token = **harga list Surplus** × (1 + markup), dibulatkan **ke atas**. Markup default 0%, boleh diubah per model, boleh negatif |
| Biaya deposit | 3% di atas nominal deposit rupiah; menutup biaya QRIS Sumopod (0,7% + Rp 300) |
| Paket bulanan | Biaya langganan Pro/Tim di luar token (belum dibahas di PRD backend) |

Rumus (semua integer: micro-dollar dan basis point, tanpa float):

- Biaya request = biaya nyata dari Surplus (`buyer_cost_micro`), bukan dihitung dari tabel biaya
- Pendapatan request = token_input × harga_input/1M + token_output × harga_output/1M (+ cache; rincian di
  `PRD/gateway-pricing-billing.md` §7.2)
- Laba kotor = pendapatan − biaya; **margin** = laba ÷ pendapatan; **markup** = laba ÷ biaya
- Markup 10% = margin 9,1%. Laporan keuangan memakai margin, pengaturan harga memakai markup.
- Deposit Rp 100.000 dengan biaya 3%: pengguna bayar Rp 103.000, biaya Sumopod Rp 1.021, nbytes menerima Rp 101.979,
  sisa Rp 1.979 di atas nominal.

Sudah diatur di `PRD/gateway-pricing-billing.md`: request gagal (§7.4), selisih kurs (kurs admin + 4%, B4), cache
prompt (§7.2). Belum dihitung: biaya server. Perubahan harga wajib tercatat di audit log dan diumumkan ke pengguna
sebelum berlaku.

### A.9 Visual dan layout

Mengikuti `.claude/rules/dashboard-design.md` (token `app-*`, font, radius, spasi), karena admin adalah alat kerja
(mode Operate).

- Shell admin: sidebar satu tingkat 256px di `app-page` dengan judul grup dan item; label "Admin" di samping logo supaya
  tidak tertukar dengan dashboard pengguna. Di bawah `lg` sidebar menjadi drawer mengambang (pola sama dengan dashboard).
- Header 64px: tombol menu (mobile), nama halaman, badge "Data contoh", switch tema, identitas admin.
- Konten maks 1200px, padding 40px desktop / 20px mobile, halaman scroll di window.
- Tabel lebar menggulung ke samping di dalam kartunya sendiri saja; halaman tidak pernah scroll horizontal di 320–1920px.

### A.10 Lokasi file UI (sesuai `architecture.md`)

| Apa | Lokasi |
|---|---|
| Route login | `src/app/admin/login/page.tsx` |
| Layout + halaman admin | `src/app/admin/(console)/layout.tsx`, `src/app/admin/(console)/<page>/page.tsx` |
| Komponen | `src/components/admin/{shell,shared,<page>}/` |
| Kit bersama dashboard + admin | `src/components/app-kit/` |
| Validasi login admin | `src/lib/admin-auth/admin-auth-contract.ts` (+ test) |
| Mock auth admin | `src/lib/admin-auth/admin-auth-client.ts` |

Lokasi backend: §10.

### A.11 Aksesibilitas

WCAG 2.2 AA: fokus pindah ke judul langkah saat login berganti langkah, error diumumkan (`role="alert"`), input kode
punya label untuk pembaca layar, semua aksi bisa dengan keyboard, target sentuh ≥ 40px.

### A.12 Kriteria penerimaan (fase frontend)

1. `/admin/login` menyelesaikan alur email → 10 digit → TOTP dengan mock dan mengarah ke `/admin`.
2. Kedelapan route admin (sembilan sebelum Admin & akses dihapus, C9) tampil di 375px dan 1440px tanpa scroll horizontal halaman, light dan dark.
3. `npx tsc --noEmit`, `npm run lint`, dan test contract lolos.
4. Tidak ada perubahan pada landing, `/login` pengguna, atau token global.

### A.13 Keputusan awal fase frontend dan statusnya

1. Daftar peran final (Owner/Admin/Support) dan izin per halaman → digantikan C9: Owner tunggal, tanpa peran.
2. Domain email admin yang diizinkan atau undangan manual saja → gugur (C9).
3. Durasi sesi dan idle timeout → 8 jam / 30 menit (§8).
4. IP allowlist untuk admin → C8.

### A.14 Di luar cakupan (fase berikutnya)

Halaman detail pengguna, refund/kredit manual, ekspor CSV, notifikasi peringatan (email/Slack), pengaturan routing per
model.
