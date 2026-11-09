# PRD: Backend Auth Pengguna (Login/Register OTP Email 8 Digit)

| | |
|---|---|
| Status | Draft v1, menunggu keputusan owner (§16) |
| Tanggal | 2026-11-09 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | Backend login & register pengguna di `/login`: kirim kode, verifikasi kode, buat akun, sesi, logout, proteksi halaman dashboard, dan perubahan frontend yang wajib agar tersambung |
| Di luar cakupan | Login admin `/admin/login` (punya PRD sendiri: `PRD/admin-console.md`), API key, billing, hapus akun, ganti email, OAuth, passkey (§17) |
| Frontend acuan | Sudah ada dan dibaca utuh: `src/components/auth/*`, `src/lib/auth-contract.ts`, `src/lib/auth-client.ts` (masih mock) |

Aturan baca: setiap klaim tentang kode proyek dan docs berasal dari file yang dibuka di sesi ini (daftar di §18). Praktik keamanan umum yang tidak dikutip dari dokumen yang dibuka ditandai **(praktik umum)**. Yang tidak bisa dibuktikan ditandai **belum dibuktikan**.

---

## 1. Ringkasan

Pengguna masuk tanpa password. Satu alur untuk login dan register:

1. Pengguna isi email → server kirim kode 8 digit ke email itu.
2. Pengguna isi kode → server cek kode → kalau email belum punya akun, akun dibuat saat itu → sesi dibuat → masuk dashboard.

Prinsip utama:
- **Respons ke browser tidak pernah membocorkan apakah sebuah email sudah terdaftar** (anti enumerasi akun).
- **Akun hanya dibuat setelah kode terbukti benar**, jadi tidak ada akun "belum terverifikasi" atau akun sampah.
- **Kode, token sesi, dan pepper tidak pernah disimpan mentah atau dicatat di log.**
- Pengecekan izin dilakukan dekat dengan data (Data Access Layer), bukan hanya di Proxy (sesuai docs Next.js `authentication.md`).

---

## 2. Kondisi frontend saat ini (bukti)

| Hal | Isi kode sekarang | Dampak ke backend |
|---|---|---|
| Tab Login / Register | `email-step.tsx`, `auth-copy.ts`. Komentar di `auth-copy.ts`: *"Both modes run the same email-code flow: an unknown email gets a new account."* `?mode=register` membuka tab Register (`login/page.tsx`). | Backend memakai **satu alur** untuk kedua tab (§4). |
| Teks persetujuan | "Dengan melanjutkan, Anda setuju dengan Ketentuan dan Privasi", link masih `href="#"` | Simpan waktu dan versi persetujuan saat akun dibuat (§9.1). Halaman Ketentuan/Privasi belum ada. |
| Validasi | `auth-contract.ts`: `normalizeEmail` (trim + lowercase), `isValidEmail` (≤ 254, pola `x@y.z`), `sanitizeOtp`, `isValidOtp` (tepat 8 digit), `maskEmail`, `OTP_MAX_ATTEMPTS = 5` | Dipakai ulang di server, tidak diduplikasi (aturan `architecture.md` §3). |
| Bentuk error yang diharapkan UI | `AuthError` di `auth-client.ts`: `offline`, `unavailable`, `rate_limited { retryAfterMinutes }`, `invalid { attemptsLeft }`, `expired` | Kontrak API (§8) dipetakan persis ke lima jenis ini. |
| Sukses kirim | `requestOtp` mengembalikan `{ resendAfter: 60 }` (detik), UI menghitung mundur 60 detik | Server mengembalikan `resendAfter` yang sama dengan cooldown sebenarnya. |
| Sukses verifikasi | `login-form.tsx`: `router.push("/")` setelah 1 detik | Diganti: server mengembalikan `redirect` (§8.2). |
| Kode demo | `DEMO_CODE_HINT = "12345678"` tampil saat `NODE_ENV === "development"` | Dihapus saat backend tersambung (§13). |
| Tombol keluar dashboard | `sidebar-user.tsx`: `<Link href="/login">` | Harus diganti `<form method="post">` ke endpoint logout. Logout lewat GET berbahaya karena `Link` bisa di-prefetch (§10.4). |
| Data akun di dashboard | `dashboard/shared/dashboard-data.ts`: `account.userName`, `account.email` (mock) | Diganti data pengguna dari sesi (§13). |
| Halaman dashboard | `src/app/(dashboard)/*` belum ada pengecekan login; `src/proxy.ts` belum ada | Proteksi ditambahkan (§10). |
| Admin | `admin/users`: status `active` / `suspended` / `pending`; `admin/settings`: "Izinkan pendaftaran baru. Saat mati, hanya akun yang sudah ada yang bisa masuk." | Backend pengguna harus menghormati status `suspended` dan saklar pendaftaran (§4.3). Status `pending` tidak dibutuhkan alur ini (§16). |
| Konfigurasi | `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `allowedDevOrigins: ["dev.nbytes.id"]` | Membaca sesi wajib di balik `<Suspense>` (§10.2). |
| Stack | Next 16.4.5, React 19.3.0, drizzle-orm 0.45.4, drizzle-kit 0.31.11, pg 8.23.1, Node 24.22.1, Postgres 18 (Docker, `postgres:18-bookworm`; dipindah dari 17 atas keputusan owner 2026-11-09). Tidak ada `zod`, tidak ada library sesi/email. Test memakai `node:test`. | Semua kebutuhan kripto pakai `node:crypto` bawaan; tanpa dependensi baru kecuali provider email (§12). |

---

## 3. Keputusan desain inti

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Login dan register **satu alur, satu endpoint** | Sudah begitu di frontend; mencegah enumerasi; tidak ada pesan "email sudah terdaftar" / "email belum terdaftar". |
| D2 | Akun dibuat **saat verifikasi berhasil**, bukan saat kode diminta | Tidak ada akun tanpa email terbukti; tidak ada akun sampah dari bot. |
| D3 | OTP 8 digit dari CSPRNG, disimpan sebagai HMAC-SHA256 dengan pepper | Kebocoran database tidak membuka kode. |
| D4 | Sesi di database (token acak di cookie, hash di DB), bukan JWT | Sesi bisa dicabut seketika (logout, akun ditangguhkan). Postgres sudah ada. Docs Next menyebut keduanya sah ("Stateless Sessions" dan "Database Sessions"). |
| D5 | Endpoint berupa **Route Handler** di `src/app/api/auth/*` | Sesuai `architecture.md` (endpoint HTTP di `app/api/<domain>/`, komponen memanggil lewat `*-client.ts`). |
| D6 | Pemeriksaan `Origin` dilakukan manual di setiap route handler | Perlindungan `Origin` bawaan Next hanya berlaku untuk Server Actions (docs `serverActions.md`), bukan Route Handler. |
| D7 | Rate limit disimpan di Postgres | Tidak menambah Redis. Cukup untuk satu region (catatan `shortcut:` di §7.4). |

---

## 4. Alur dan semua skenario

### 4.1 Alur utama

```
[Langkah 1] POST /api/auth/otp/request { email, mode }
  1. Cek Origin + Content-Type + ukuran body
  2. Validasi email (auth-contract)
  3. Rate limit (IP, email)               -> 429 rate_limited
  4. Tentukan jenis email yang dikirim (tabel 4.2), TANPA mengubah respons
  5. Buat kode baru, batalkan kode lama email ini, simpan hash
  6. Kirim email                          -> gagal: 503 unavailable
  7. 202 { ok: true, resendAfter: 60 }    (sama untuk semua email)

[Langkah 2] POST /api/auth/otp/verify { email, code, next? }
  1. Cek Origin + Content-Type + ukuran body
  2. Validasi email & kode
  3. Rate limit (IP)                      -> 429 rate_limited
  4. Ambil kode aktif email ini (transaksi, kunci baris)
       tidak ada / kedaluwarsa / percobaan habis -> 410 expired
  5. Naikkan attempts SEBELUM membandingkan, bandingkan constant-time
       salah -> 401 invalid { attemptsLeft } (0 -> 410 expired)
  6. Tandai kode terpakai
  7. Cari user; tidak ada -> buat (jika pendaftaran dibuka)
       user ditangguhkan / pendaftaran tutup -> 410 expired (generik, lihat 4.3)
  8. Buat sesi baru, set cookie
  9. 200 { ok: true, redirect }
```

### 4.2 Langkah 1: apa yang terjadi per jenis email

Respons ke browser **selalu** `202 { ok: true, resendAfter: 60 }` (kecuali input salah, rate limit, atau provider email gagal, yang berlaku sama untuk semua email). Bedanya hanya isi email, yang hanya bisa dibaca pemilik inbox.

| Kondisi email | Tab yang dipakai | Email yang dikirim | Kode dibuat? |
|---|---|---|---|
| Belum terdaftar, pendaftaran dibuka | Login **atau** Register | "Kode untuk membuat akun nbytes: XXXX XXXX" | Ya |
| Sudah terdaftar, aktif | Login **atau** Register | "Kode login nbytes: XXXX XXXX" | Ya |
| Belum terdaftar, pendaftaran ditutup admin | apa saja | "Pendaftaran akun baru sedang ditutup. Tidak ada kode yang dibuat." | Tidak |
| Sudah terdaftar, status `suspended` | apa saja | "Akun Anda sedang ditangguhkan. Hubungi support." | Tidak |

Jawaban untuk pertanyaan owner:
- **User belum register tapi langsung klik Login:** kode tetap dikirim (email "membuat akun"), dan setelah kode benar akun langsung dibuat lalu masuk. Tidak ada pesan "akun tidak ditemukan".
- **User sudah punya akun tapi klik Register:** kode tetap dikirim (email "login"), setelah kode benar langsung masuk ke akun yang sudah ada. Tidak ada pesan "email sudah dipakai".
- Alasan tidak memberi pesan berbeda: pesan berbeda memungkinkan siapa pun mengecek apakah email tertentu adalah pelanggan **(praktik umum: pencegahan enumerasi akun)**.
- `mode` dari tab hanya dipakai untuk analitik dan tidak mengubah perilaku server.

### 4.3 Langkah 2: hasil per kondisi

| Kondisi | HTTP | `error.code` → `AuthError.kind` | Pesan UI (sudah ada di `auth-copy.ts`) |
|---|---|---|---|
| Kode benar, user lama aktif | 200 | — | "Berhasil login." |
| Kode benar, user baru, pendaftaran dibuka | 200 (akun dibuat) | — | "Berhasil login." |
| Kode salah, sisa percobaan > 0 | 401 | `invalid` + `attemptsLeft` | "Kode salah. Sisa N percobaan." |
| Kode salah, percobaan habis | 410 | `expired` | "Kode tidak berlaku lagi. Minta kode baru." |
| Kode lewat 10 menit | 410 | `expired` | sama |
| Kode sudah pernah dipakai | 410 | `expired` | sama |
| Tidak ada kode untuk email itu (tidak pernah minta, atau sudah diganti kode baru) | 410 | `expired` | sama |
| Status user berubah jadi `suspended` antara langkah 1 dan 2, atau pendaftaran ditutup di antaranya | 410 | `expired` | sama (alasan sebenarnya dicatat di `auth_events`) |
| Terlalu banyak percobaan dari IP | 429 | `rate_limited` + `retryAfterMinutes` | "Terlalu banyak percobaan. Coba lagi dalam M menit." |
| Input tidak valid (bukan 8 digit, email rusak) | 400 | `invalid_input` → UI pakai pesan validasi yang sudah ada | "Masukkan 8 digit kode." / "Masukkan alamat email yang valid." |
| Error server / DB | 503 | `unavailable` | "Kode belum bisa dikirim. Coba lagi sebentar lagi." (§13 mengusulkan pesan khusus verifikasi) |

Kebocoran yang diterima: penyerang yang memasukkan email orang lain bisa membedakan "ada kode aktif" (401) dari "tidak ada kode" (410) hanya dalam 10 menit setelah **seseorang** meminta kode. Karena siapa pun bisa memicu permintaan kode, ini tidak membuka status pendaftaran. Risiko rendah, diterima.

### 4.4 Skenario lain yang wajib ditangani

| Skenario | Perilaku |
|---|---|
| Klik "Kirim ulang kode" sebelum 60 detik (memanggil API langsung) | `429 rate_limited` dengan `retryAfterMinutes` = sisa cooldown dibulatkan ke atas (min. 1). |
| Kirim ulang setelah 60 detik | Kode lama dibatalkan, kode baru dikirim, percobaan kembali 5. |
| Dua tab membuka langkah kode, salah satu minta kode baru | Kode di tab lain otomatis tidak berlaku → `410 expired`. |
| Dua request verifikasi bersamaan dengan kode benar | Hanya satu yang berhasil (baris dikunci, `consumed_at` dicek). Yang lain `410 expired`. |
| Dua request verifikasi bersamaan untuk email baru | Hanya satu user dibuat (unique index `users.email` + `ON CONFLICT DO NOTHING` lalu ambil ulang). |
| Banyak request verifikasi paralel dengan kode berbeda (brute force) | Attempts dinaikkan di dalam transaksi terkunci sebelum dibandingkan, sehingga batas 5 tidak bisa dilewati lewat paralelisme. |
| Email dengan huruf besar/spasi ("  Andi@X.com ") | Dinormalisasi `normalizeEmail` → satu akun. Titik dan `+tag` **tidak** dibuang (alamat berbeda tetap akun berbeda). |
| Pengguna sudah login lalu membuka `/login` | Halaman login (server) memeriksa sesi valid → redirect ke dashboard. Proxy **tidak** boleh melakukan redirect ini berdasarkan ada/tidaknya cookie saja (§10.3). |
| Sesi kedaluwarsa saat di dashboard | Halaman: redirect ke `/login?next=<path>`. Request API: `401`. |
| Akun ditangguhkan admin saat sedang login | Semua sesi user dihapus saat admin menangguhkan; pengecekan DAL berikutnya gagal → `/login`. |
| Parameter `next` berbahaya (`//evil.com`, `https://evil.com`, `/\evil.com`) | Diabaikan, pakai tujuan default (§8.2). |
| Browser tanpa JavaScript | Tidak didukung untuk login (form saat ini butuh JS). Logout tetap jalan tanpa JS (form POST). |
| Provider email gagal/timeout | `503 unavailable`, kode yang baru dibuat dihapus, tidak dihitung sebagai cooldown. |
| Email masuk spam / tidak sampai | Di luar kendali kode; mitigasi lewat SPF/DKIM/DMARC (§12.3) dan tombol kirim ulang. |
| Kode diminta untuk alamat yang tidak bisa menerima email (bounce) | Respons tetap `202`. Bounce dicatat lewat webhook provider jika tersedia **(belum diputuskan, tergantung provider)**. |

---

## 5. Aturan OTP

| Aturan | Nilai | Catatan |
|---|---|---|
| Panjang | 8 digit (`OTP_LENGTH`), ruang 10^8 | Sudah ditetapkan owner dan frontend |
| Pembuatan | `crypto.randomInt(0, 100_000_000)` lalu `padStart(8, "0")` | `node:crypto` (diverifikasi tersedia di Node 24.22.1). Jangan `Math.random`. |
| Penyimpanan | `HMAC-SHA256(key = AUTH_OTP_PEPPER, msg = "user-login:" + emailNormalized + ":" + code)`, hex | Prefix tujuan (`user-login:`) memisahkan dari OTP admin yang mungkin memakai pepper sama. |
| Perbandingan | `crypto.timingSafeEqual` pada buffer hash yang sama panjang | Constant-time |
| Masa berlaku | 10 menit | |
| Percobaan per kode | 5 (`OTP_MAX_ATTEMPTS`) | Peluang tebak ≤ 5 / 10^8 per kode |
| Kode aktif per email | Maks. 1. Kode baru membatalkan kode lama. | |
| Sekali pakai | `consumed_at` diisi saat sukses | |
| Cooldown kirim ulang | 60 detik (sama dengan `resendAfter` yang dibaca UI) | |
| Isi kode di log | **Dilarang**, kecuali mode pengembangan lokal (§12.4) | |

Rotasi `AUTH_OTP_PEPPER`: cukup ganti nilai env dan deploy. Kode yang sedang berjalan (maks. 10 menit) menjadi tidak berlaku; pengguna tinggal minta kode baru.

---

## 6. Sesi

| Aturan | Nilai | Sumber / alasan |
|---|---|---|
| Token | 32 byte `crypto.randomBytes`, base64url | (praktik umum) entropi ≥ 128 bit |
| Disimpan di DB | `SHA-256(token)` saja | Kebocoran DB tidak bisa dipakai login |
| Nama cookie | `__Host-nb_session` di HTTPS; `nb_session` saat `NODE_ENV=development` di `http://localhost` | Prefix `__Host-` memaksa `Secure`, `Path=/`, tanpa `Domain` (praktik umum). Dev server lewat `dev.nbytes.id` **belum dibuktikan** memakai HTTPS. |
| Opsi cookie | `httpOnly: true`, `secure: true` (produksi), `sameSite: "lax"`, `path: "/"`, `expires` = waktu kedaluwarsa sesi | Opsi yang direkomendasikan docs Next (`authentication.md` "Setting cookies"). `lax` agar link dari email/landing ke dashboard tetap membawa sesi; sesi admin terpisah memakai `strict` (PRD admin §8). |
| Umur absolut | 30 hari sejak login | Usulan, keputusan owner (§16) |
| Idle timeout | 7 hari tanpa aktivitas | Usulan |
| Perpanjangan | `last_seen_at` diperbarui paling sering 1×/jam; tidak memperpanjang melewati umur absolut | Mengurangi tulis ke DB |
| Session fixation | Selalu buat token baru saat login; token lama (jika ada) dihapus | (praktik umum) |
| Logout | `POST`, hapus baris sesi, hapus cookie (`maxAge: 0`) | Docs `cookies.md`: set/hapus cookie hanya di Server Function atau Route Handler |
| Logout semua perangkat | Fungsi `deleteUserSessions(userId)` dipakai saat akun ditangguhkan; tombol untuk pengguna di fase berikutnya | |
| Cookie ditolak kalau | Tidak ada baris, kedaluwarsa, idle lewat batas, user `suspended`, atau user dihapus | |

---

## 7. Rate limit dan anti-penyalahgunaan

### 7.1 Batas

| Kunci | Batas | Jendela | Saat terlampaui |
|---|---|---|---|
| Kirim kode per email (`hash(email)`) | 1 per 60 detik (cooldown) dan 5 per jam | geser 60 s / tetap 1 jam | 429 |
| Kirim kode per IP | 20 per jam | tetap 1 jam | 429 |
| Verifikasi per IP | 30 per jam | tetap 1 jam | 429 |
| Verifikasi per kode | 5 percobaan | umur kode | 410 |
| Global kirim email | Batas dari provider; ditambah alarm jika > N/menit (N **belum diputuskan**) | — | alarm, bukan blokir |

Semua angka usulan; owner boleh mengubah (§16). Admin console sudah punya pengaturan "rate limit default" (UI), sambungannya di fase admin backend.

### 7.2 Respons 429

`{ ok: false, error: { code: "rate_limited", retryAfterMinutes: n } }` + header `Retry-After: <detik>`. `n` dibulatkan ke atas, minimal 1, sesuai yang dibaca UI.

### 7.3 Sumber IP klien

Next 15 ke atas menghapus `request.ip` (docs `next-request.md`: "v15.0.0 ip and geo removed"). IP dibaca dari header proxy tepercaya lewat `headers()`. Header mana yang tepercaya tergantung hosting (mis. `cf-connecting-ip` di belakang Cloudflare, `x-forwarded-for` hop terakhir dari reverse proxy sendiri). Hosting **belum diputuskan**, jadi:
- Fungsi `clientIp()` membaca satu header yang ditentukan env `AUTH_TRUSTED_IP_HEADER`.
- Jika header tidak ada: pakai kunci `ip:unknown` (tetap dibatasi bersama-sama, bukan dilewati).
- IP disimpan di tabel rate limit sebagai HMAC (bukan mentah).

### 7.4 Implementasi

Tabel `auth_rate_limits` (kunci + awal jendela + hitungan), naik lewat `INSERT ... ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count` (Drizzle `onConflictDoUpdate`, dicek di context7 untuk drizzle-orm 0.45.4). Tulis komentar di kode:
`// shortcut: rate limit di Postgres cukup untuk satu region; pindah ke store khusus jika trafik login tinggi atau multi-region`.

### 7.5 Lain-lain

- Docs Next (`backend-for-frontend.md`) juga menyarankan memakai fitur rate limit dari hosting, selain di kode.
- CAPTCHA (mis. Cloudflare Turnstile) **tidak** dipasang di awal; disiapkan sebagai opsi jika terlihat penyalahgunaan (§16).
- Blokir domain email sekali pakai: opsional, keputusan owner.

---

## 8. Kontrak API

Semua endpoint: `POST`, body JSON ≤ 1 KB, wajib header `Content-Type: application/json` dan `Origin` sama dengan `APP_URL`. Respons memakai `Cache-Control: no-store`.

Format error tunggal:
```json
{ "ok": false, "error": { "code": "invalid_input | rate_limited | invalid | expired | unavailable", "retryAfterMinutes": 3, "attemptsLeft": 2 } }
```
Field tambahan hanya muncul untuk kode yang relevan. Tidak ada pesan teks dari server: UI memakai `authErrorMessage` yang sudah ada.

### 8.1 `POST /api/auth/otp/request`

| | |
|---|---|
| Body | `{ "email": string, "mode"?: "login" \| "register" }` |
| 202 | `{ "ok": true, "resendAfter": 60 }` |
| 400 | `invalid_input` |
| 403 | Origin/Content-Type salah → body `unavailable` (tidak menjelaskan alasan ke klien) |
| 429 | `rate_limited` |
| 503 | `unavailable` |

### 8.2 `POST /api/auth/otp/verify`

| | |
|---|---|
| Body | `{ "email": string, "code": string, "next"?: string }` |
| 200 | `{ "ok": true, "redirect": string }` + `Set-Cookie` sesi |
| 400 | `invalid_input` |
| 401 | `invalid` + `attemptsLeft` |
| 410 | `expired` |
| 429 | `rate_limited` |
| 503 | `unavailable` |

`redirect`:
- Jika `next` lolos `safeNextPath` (diawali satu `/`, bukan `//` atau `/\`, tanpa skema, tanpa karakter kontrol, dan termasuk path dashboard) → `next`.
- Jika tidak: user baru → `/quick-start`; user lama → `/quick-start` juga, sampai owner menentukan halaman awal lain (§16).

### 8.3 `POST /api/auth/logout`

| | |
|---|---|
| Body | kosong (dipanggil dari `<form method="post">`) |
| Respons | `303` ke `/login`, cookie dihapus. Tetap `303` walau sesi sudah tidak ada (idempoten). |
| Origin | Dicek; jika beda → `403` tanpa menghapus sesi |

### 8.4 Validasi (satu tempat)

`src/lib/auth-contract.ts` ditambah fungsi murni:
- `parseOtpRequestBody(json)` → `{ email, mode }` atau error
- `parseOtpVerifyBody(json)` → `{ email, code, next }` atau error
- `safeNextPath(value)` → path atau `null`

Dipakai route handler (server) dan bisa dipakai klien. `zod` tidak terpasang; validasi ditulis tangan, dengan unit test.

---

## 9. Model data

File: `src/lib/server/db/schema/auth.ts`, di-export ulang dari `schema/index.ts`. Semua waktu `timestamp with time zone`, disimpan UTC. API Drizzle yang dipakai (`pgTable`, `uuid().defaultRandom()`, `timestamp({ withTimezone: true }).defaultNow()`, `uniqueIndex`, `references(..., { onDelete: "cascade" })`, `onConflictDoUpdate`, `db.transaction`, `.for("update")`) dicek di context7 untuk drizzle-orm 0.45.4 dan di `node_modules/drizzle-orm`.

### 9.1 `users`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | `defaultRandom()` |
| `email` | text, not null, unique index | sudah dinormalisasi |
| `name` | text null | diisi dari Account Settings nanti |
| `status` | text not null default `'active'` | `active` \| `suspended` |
| `email_verified_at` | timestamptz not null | = saat akun dibuat (akun hanya dibuat setelah verifikasi) |
| `terms_accepted_at` | timestamptz not null | persetujuan teks di form |
| `terms_version` | text not null | mis. `"2026-11-09"`; nilai dari konstanta server |
| `last_login_at` | timestamptz null | |
| `created_at` | timestamptz not null default now() | |

### 9.2 `otp_challenges`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | |
| `email` | text not null | index |
| `purpose` | text not null | `'user-login'` (memisahkan dari admin) |
| `code_hash` | text not null | HMAC hex |
| `attempts` | integer not null default 0 | |
| `expires_at` | timestamptz not null | |
| `consumed_at` | timestamptz null | |
| `created_at` | timestamptz not null default now() | |

Satu kode aktif per (`email`, `purpose`): saat membuat kode baru, baris lama yang belum terpakai dihapus dalam transaksi yang sama.

### 9.3 `sessions`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → `users.id` on delete cascade | index |
| `token_hash` | text not null, unique index | SHA-256 hex |
| `expires_at` | timestamptz not null | umur absolut |
| `last_seen_at` | timestamptz not null | idle timeout |
| `created_at` | timestamptz not null default now() | |
| `user_agent` | text null | dipotong 256 karakter; untuk daftar perangkat nanti |

### 9.4 `auth_rate_limits`

| Kolom | Tipe | Catatan |
|---|---|---|
| `key` | text not null | mis. `otp-send:email:<hmac>`, `otp-verify:ip:<hmac>` |
| `window_start` | timestamptz not null | |
| `count` | integer not null | |
| PK | (`key`, `window_start`) | |

### 9.5 `auth_events` (jejak audit)

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid null → `users.id` on delete set null | |
| `email_hash` | text not null | HMAC email (bukan email mentah) |
| `type` | text not null | `otp_requested`, `otp_send_failed`, `otp_failed`, `otp_expired`, `login_success`, `account_created`, `logout`, `blocked_suspended`, `blocked_signup_closed`, `rate_limited` |
| `ip_hash` | text null | |
| `created_at` | timestamptz not null default now() | index |

### 9.6 Retensi dan pembersihan

| Tabel | Hapus setelah |
|---|---|
| `otp_challenges` | 24 jam sejak `expires_at` |
| `auth_rate_limits` | 24 jam sejak `window_start` |
| `sessions` | saat kedaluwarsa (dibersihkan berkala) |
| `auth_events` | 90 hari (usulan) |

Mekanisme job berkala **belum diputuskan** (tergantung hosting: cron platform, `pg_cron`, atau skrip terjadwal).

### 9.7 Migrasi

`npm run db:generate` → review SQL di `drizzle/` → `npm run db:migrate` ke database **lokal** (`npm run db:up` dulu). Migrasi ke database non-lokal hanya dengan persetujuan owner (aturan `backend-security.md`).

---

## 10. Proteksi halaman (Next.js 16.4.5)

### 10.1 Data Access Layer

`src/lib/server/auth/current-user.ts`:
- `getCurrentUser()`: baca cookie → hash → cari sesi + user → cek kedaluwarsa, idle, status → kembalikan objek sempit `{ id, email, name }`. Tidak ada sesi → `redirect("/login")`.
- Dipakai halaman, layout, Server Action, dan Route Handler. Docs `authentication.md`: pengecekan utama dilakukan di DAL, Proxy hanya cek optimistik.
- Objek yang dikirim ke komponen klien hanya field yang dibutuhkan (docs: DTO, `data-security.md`).

### 10.2 Cache Components (`cacheComponents: true`)

Dari docs `authentication-with-cache-components.md`:
- Membaca `cookies()` di luar `<Suspense>` adalah **build error** saat Cache Components aktif. Komponen yang membaca sesi harus berada di balik `<Suspense>`.
- Jangan `await` sesi di level atas layout dashboard; letakkan di komponen di dalam boundary (mis. `SidebarUser`, header), supaya bingkai dashboard tetap dari static shell.
- `getCurrentUser` boleh memakai `'use cache: private'` (hasil hanya disimpan di browser, default `stale` 5 menit). Konsekuensi: setelah logout di perangkat lain atau akun ditangguhkan, tampilan yang sudah tercache bisa bertahan sampai 5 menit. **Karena itu setiap Route Handler dan Server Action yang mengubah data atau membaca data sensitif memanggil versi tanpa cache (`requireSession()`)** yang selalu cek database.
- Jangan pakai email mentah atau token sebagai argumen fungsi `use cache` atau `cacheTag`: docs menyebut key dan tag disimpan sebagai teks biasa. Pakai `user.id`.
- Jika `stale` diatur dengan `cacheLife`, minimal 30 detik agar tetap ikut prefetch (docs).

### 10.3 Proxy (`src/proxy.ts`)

File `middleware` sudah deprecated dan diganti `proxy` di versi ini (docs `proxy.md`). Proxy berjalan untuk setiap route termasuk prefetch, jadi:
- Hanya cek **ada/tidaknya** cookie sesi, tanpa query DB (docs `authentication.md`).
- `matcher` hanya untuk path dashboard: `/quick-start`, `/playground`, `/docs`, `/usage`, `/api-keys`, `/models`, `/billing`, `/settings` (beserta sub-path). Tidak menyentuh `/`, `/login`, `/admin`, `/api`, `_next`, file statis.
- Cookie tidak ada → redirect ke `/login?next=<path>`.
- **Tidak** me-redirect `/login` ke dashboard hanya karena cookie ada: cookie bisa sudah tidak valid, dan itu menyebabkan loop (`/login` → dashboard → DAL menolak → `/login`). Pengecekan "sudah login" di `/login` dilakukan oleh halaman itu sendiri lewat DAL.
- Docs: Proxy bukan satu-satunya pertahanan; matcher yang berubah bisa diam-diam menghapus proteksi.

### 10.4 Logout harus POST

`sidebar-user.tsx` sekarang memakai `<Link href="/login">`. Jika logout dibuat sebagai GET, `Link` bisa mem-prefetch URL itu dan mengeluarkan pengguna tanpa sengaja, dan situs lain bisa memicunya lewat tag gambar **(praktik umum)**. Ganti dengan `<form action="/api/auth/logout" method="post">` berisi tombol ikon yang sama.

---

## 11. Keamanan

### 11.1 Daftar kontrol

| Ancaman | Kontrol |
|---|---|
| Enumerasi akun | Respons langkah 1 identik untuk semua email (§4.2); tidak ada pesan "terdaftar/tidak terdaftar"; perbedaan hanya di isi email |
| Tebak kode (brute force) | 10^8 kemungkinan, 5 percobaan/kode, 30 verifikasi/IP/jam, attempts dinaikkan di transaksi terkunci |
| Race condition | `SELECT ... FOR UPDATE` dalam `db.transaction`; `consumed_at IS NULL` dicek; unique index email |
| Kebocoran DB | Kode = HMAC berpepper, token sesi = SHA-256, email di audit/rate limit = HMAC |
| Timing attack pada perbandingan | `timingSafeEqual` |
| CSRF | `Origin` wajib sama dengan `APP_URL` (manual, karena Route Handler tidak punya cek bawaan seperti Server Actions), `Content-Type: application/json` wajib, cookie `SameSite=Lax`, semua aksi berubah-state hanya `POST` |
| Pencurian cookie lewat XSS | `HttpOnly`; tidak ada token di `localStorage`; React meng-escape output |
| Session fixation | Token baru setiap login |
| Open redirect | `safeNextPath` + daftar path dashboard |
| Spam email / biaya provider | Cooldown, batas per email & IP, alarm volume |
| Phishing lewat email | Email tanpa link login, tanpa tombol; hanya kode, masa berlaku, dan kalimat "Abaikan jika Anda tidak meminta kode ini." |
| Kode terlihat di notifikasi layar kunci | Kode **tidak** ditaruh di subjek email (usulan; trade-off dengan kenyamanan, §16) |
| Kebocoran lewat log | Tidak mencatat kode, token, pepper, email lengkap (pakai `maskEmail`), body request |
| Kebocoran lewat cache | `Cache-Control: no-store` di respons auth; tidak ada data sensitif di key/tag cache |
| Secret di bundle klien | Semua secret tanpa prefix `NEXT_PUBLIC_`, modul server diawali `import "server-only"` |
| Akun ditangguhkan tetap login | Sesi dihapus saat ditangguhkan; DAL cek status setiap request tanpa cache |

### 11.2 Header keamanan

Disarankan untuk seluruh situs (bukan khusus auth): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` lewat CSP. Docs Next punya panduan `content-security-policy.md`; penerapan CSP lengkap **di luar cakupan** PRD ini, dicatat sebagai pekerjaan terpisah.

### 11.3 Error handling

- Server memakai satu kelas `AppError` di `src/lib/server/errors.ts` (diwajibkan `architecture.md` §5; file **belum ada**, dibuat di pekerjaan ini) dengan `code` (lima kode di §8) dan `status`.
- Route handler menangkap `AppError` → respons JSON sesuai kontrak; error lain → dicatat di log server (tanpa data sensitif) dan dikembalikan sebagai `503 unavailable`.
- Tidak pernah mengirim stack trace atau pesan error DB ke klien.

### 11.4 Data pribadi

Yang disimpan: email, waktu persetujuan, waktu login, user agent, hash IP. Kewajiban hukum perlindungan data pribadi di Indonesia (UU PDP No. 27 Tahun 2022) perlu dicek tim legal; kebijakan retensi §9.6 adalah usulan teknis, **belum dibuktikan** sesuai kewajiban hukum.

---

## 12. Email

### 12.1 Isi

| Bagian | Isi |
|---|---|
| Pengirim | `EMAIL_FROM`, mis. `nbytes <no-reply@nbytes.id>` (domain **belum dikonfirmasi** owner) |
| Subjek | "Kode login nbytes" / "Kode untuk membuat akun nbytes" (tanpa angka kode) |
| Isi | Kode dalam format `1234 5678` (sama dengan pengelompokan 4–4 di UI), berlaku 10 menit, "Abaikan jika Anda tidak meminta kode ini." Versi teks biasa dan HTML sederhana. |
| Tidak boleh | Link login, tombol, gambar pelacak |
| Bahasa | Indonesia (sama dengan UI saat ini) |

### 12.2 Provider

**Belum diputuskan** (kandidat: SMTP generik, Resend, Postmark, AWS SES). Desain kode: satu modul `src/lib/server/auth/mailer.ts` dengan satu fungsi `sendAuthEmail(to, kind, code?)`; ganti provider hanya mengubah file ini. Timeout kirim 10 detik; gagal → `AppError("unavailable")`. Docs library provider dicek lewat context7 saat provider dipilih.

### 12.3 Deliverability

SPF, DKIM, dan DMARC di domain pengirim wajib sebelum produksi **(praktik umum)**. Pengaturan DNS dilakukan owner.

### 12.4 Mode pengembangan

`EMAIL_PROVIDER=console` dan `NODE_ENV=development`: kode dicetak ke log server, email tidak dikirim. Kombinasi lain dengan `console` → server menolak start. Ini menggantikan kode demo `12345678` di frontend.

---

## 13. Perubahan frontend yang wajib

| File | Perubahan |
|---|---|
| `src/lib/auth-client.ts` | Ganti mock dengan `fetch` ke §8. Map respons ke `AuthResult`/`AuthError` yang sudah ada. `fetch` gagal + `navigator.onLine === false` → `offline`; gagal lain → `unavailable`. Hapus `DEMO_CODE_HINT` dan aturan `@limit.test`/`@down.test`. `verifyOtp` mengembalikan `redirect`. |
| `src/components/auth/login-form.tsx` | Kirim `mode` saat minta kode; baca `next` dari URL dan kirim saat verifikasi; `router.push(result.redirect)` menggantikan `"/"`; hapus `demoCode`. |
| `src/components/auth/otp-step.tsx` | Hapus prop dan baris `demoCode`. |
| `src/components/auth/auth-copy.ts` | Usulan: pesan `unavailable` untuk langkah verifikasi ("Belum bisa memeriksa kode. Coba lagi sebentar lagi."), karena teks sekarang menyebut "dikirim". |
| `src/app/(auth)/login/page.tsx` | Cek sesi valid (di balik `<Suspense>`) → redirect ke dashboard. Teruskan `next`. |
| `src/components/dashboard/shell/sidebar/sidebar-user.tsx` | `Link` keluar → `<form method="post" action="/api/auth/logout">`; nama dan email dari `getCurrentUser()` di balik `<Suspense>`. |
| `src/components/dashboard/shared/dashboard-data.ts` | `account.userName` / `account.email` tidak lagi dari mock untuk bagian identitas. |
| `src/components/dashboard/settings/*` | Email dari sesi (tetap read-only, sesuai teks "Hubungi kami untuk menggantinya"). Hapus akun tetap nonaktif (di luar cakupan). |
| `src/components/auth/email-step.tsx` | Link Ketentuan/Privasi tetap `#` sampai halamannya ada (§16). |

Panduan tampilan landing dan login tidak berubah (aturan `dashboard-design.md` §2: landing dan login pengguna tidak boleh berubah tampilannya); perubahan di atas hanya logika dan data.

---

## 14. Lokasi file (sesuai `architecture.md`)

```
src/
  proxy.ts                                   cek cookie optimistik untuk path dashboard
  app/
    api/auth/otp/request/route.ts            parse -> rate limit -> lib/server
    api/auth/otp/verify/route.ts
    api/auth/logout/route.ts
  lib/
    auth-contract.ts                          + parseOtpRequestBody, parseOtpVerifyBody, safeNextPath (+ test)
    auth-client.ts                            fetch nyata (menggantikan mock)
    server/
      errors.ts                               AppError
      auth/
        otp.ts                                buat, simpan, verifikasi kode
        session.ts                            buat, baca (requireSession), hapus sesi, cookie
        current-user.ts                       getCurrentUser (DAL, boleh 'use cache: private')
        rate-limit.ts                         hit(key, limit, window)
        request-guard.ts                      cek Origin, Content-Type, ukuran body, clientIp
        mailer.ts                             sendAuthEmail
        auth-events.ts                        catat event audit
        crypto.ts                             hmac(), sha256(), randomOtp(), randomToken()
      db/schema/auth.ts                       users, otp_challenges, sessions, auth_rate_limits, auth_events
```

Semua file di `lib/server/` diawali `import "server-only"`. Folder `auth/` berisi 8 file (batas ~10 per folder). Batas ukuran file/fungsi `architecture.md` §1 berlaku. Route handler hanya mengekspor `POST`.

Variabel env baru (nama saja di `.env.example`):

| Nama | Isi |
|---|---|
| `APP_URL` | Origin situs, mis. `https://nbytes.id` (untuk cek `Origin` dan link) |
| `AUTH_OTP_PEPPER` | ≥ 32 byte acak (base64) |
| `AUTH_HASH_KEY` | ≥ 32 byte acak, untuk HMAC email/IP di audit dan rate limit |
| `AUTH_TRUSTED_IP_HEADER` | nama header IP klien dari proxy tepercaya |
| `EMAIL_PROVIDER` | `console` (dev) atau nama provider |
| `EMAIL_FROM` | alamat pengirim |
| kredensial provider | nama tergantung provider (§12.2) |

Server menolak start jika env wajib kosong atau pepper < 32 byte.

---

## 15. Pengujian dan kriteria penerimaan

### 15.1 Unit test (`node:test`, sudah dipakai proyek)

- `auth-contract`: parse body, `safeNextPath` (termasuk `//evil.com`, `/\evil.com`, `https://x`, `%2F%2F`, path non-dashboard).
- `crypto`: `randomOtp` selalu 8 digit termasuk awalan nol; HMAC deterministik; perbandingan benar/salah.
- Logika keputusan langkah 1 dan 2 (tabel §4.2, §4.3) sebagai fungsi murni terpisah dari DB.

### 15.2 Integration test (DB lokal)

- Alur penuh email baru → akun dibuat → sesi → logout.
- Alur email lama.
- Kode salah 5× → 410; kode benar setelahnya tetap ditolak.
- Kode kedaluwarsa (waktu digeser) → 410.
- Kirim ulang membatalkan kode lama.
- Dua verifikasi paralel kode benar → tepat satu sukses.
- Dua verifikasi paralel email baru → tepat satu baris `users`.
- 20 verifikasi paralel kode acak → attempts tidak lewat 5.
- Rate limit per email, per IP → 429 dengan `retryAfterMinutes`.
- User `suspended` → email penangguhan, tanpa kode; verifikasi → 410.
- Pendaftaran ditutup → email baru tidak mendapat kode; email lama tetap bisa login.
- Origin salah / Content-Type salah → 403.

### 15.3 Kriteria penerimaan

- [ ] Respons langkah 1 identik (status, body, header) untuk email terdaftar, belum terdaftar, ditangguhkan, dan saat pendaftaran ditutup.
- [ ] Tidak ada kode, token, pepper, atau email lengkap di log (dicek dengan grep log selama test).
- [ ] DB tidak berisi kode atau token mentah.
- [ ] Cookie sesi `HttpOnly; Secure; SameSite=Lax; Path=/` di produksi.
- [ ] Halaman dashboard tanpa sesi → `/login?next=...`; `/login` dengan sesi valid → dashboard; cookie rusak tidak menyebabkan loop.
- [ ] Logout lewat POST, menghapus baris sesi dan cookie, jalan tanpa JS.
- [ ] Semua state UI di `auth-copy.ts` tetap muncul dengan backend nyata.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build`, semua test lolos; `npm run map` dijalankan.
- [ ] `security-review` dan `ponytail-review` dijalankan sebelum selesai (`tooling.md`).
- [ ] Penjaga tampilan landing di `dashboard-design.md` §2 bersih (tidak ada perubahan gaya pada landing dan `/login`).

---

## 16. Keputusan yang dibutuhkan dari owner

1. Konfirmasi alur satu pintu (D1/D2): login dengan email baru langsung membuat akun.
2. Provider email dan domain pengirim (`nbytes.id`?).
3. Umur sesi: absolut 30 hari dan idle 7 hari (usulan), atau nilai lain.
4. Angka rate limit (§7.1) dan TTL kode 10 menit.
5. Halaman tujuan setelah login: `/quick-start` untuk semua (usulan), atau user lama ke halaman lain.
6. Status `pending` di halaman admin users: tidak dibutuhkan alur ini (akun dibuat setelah verifikasi). Hapus, atau artinya apa?
7. Kode di subjek email: tidak (usulan, lebih aman) atau ya (lebih cepat dibaca).
8. Hosting (menentukan header IP tepercaya, HTTPS di `dev.nbytes.id`, dan job pembersihan).
9. CAPTCHA dan blokir email sekali pakai: sekarang atau hanya bila ada penyalahgunaan.
10. Versi dan halaman Ketentuan & Privasi (`terms_version`).

---

## 17. Di luar cakupan (fase berikutnya)

Login admin (OTP 10 digit + TOTP, `PRD/admin-console.md`), hapus akun (wajib verifikasi ulang dengan kode baru), ganti email, daftar perangkat dan "keluar dari semua perangkat" untuk pengguna, organisasi/tim, API key, billing, OAuth Google/GitHub, passkey/2FA pengguna, CSP lengkap, webhook bounce provider email, i18n email.

Catatan untuk fase admin: `crypto.ts`, `rate-limit.ts`, dan tabel `otp_challenges` (kolom `purpose`) bisa dipakai ulang; sesi admin harus tabel dan cookie terpisah (`SameSite=Strict`), sesuai PRD admin §8.

---

## 18. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/components/auth/*`, `src/lib/auth-contract.ts`, `src/lib/auth-client.ts`, `src/lib/auth-contract.test.ts`, `src/app/(auth)/login/page.tsx` | alur, error, validasi, copy | Dibaca utuh |
| `src/components/dashboard/shell/sidebar/sidebar-user.tsx`, `dashboard/shared/dashboard-data.ts`, `dashboard/settings/settings-copy.ts`, `dashboard/shell/nav-items.ts`, `src/app/(dashboard)/layout.tsx` | logout, data akun, path dashboard | Dibaca |
| `src/components/admin/users/users-data.ts`, `users-copy.ts`, `admin/settings/settings-copy.ts`, `PRD/admin-console.md` | status user, saklar pendaftaran, batas dengan auth admin | Dibaca (bagian relevan) |
| `package.json`, `next.config.ts`, `.env.example`, `drizzle.config.ts`, `docker-compose.yml`, `src/lib/server/db/client.ts`, `schema/index.ts`, versi di `node_modules` | stack dan versi | Dibaca |
| `AGENTS.md`, `.claude/rules/architecture.md`, `backend-security.md`, `tooling.md`, `git.md`, `dashboard-design.md` | aturan proyek | Dibaca |
| Docs Next 16.4.5 terpasang: `02-guides/authentication.md`, `authentication-with-cache-components.md`, `data-security.md`, `backend-for-frontend.md`, `03-api-reference/03-file-conventions/proxy.md`, `04-functions/cookies.md`, `next-request.md`, `unauthorized.md`, `05-config/01-next-config-js/serverActions.md` | DAL, cookie, Proxy, Cache Components, rate limit, Origin check, IP | Dibaca via `nextjs_docs` |
| context7 `/drizzle-team/drizzle-orm/0.45.4` | `timestamp withTimezone`, unique, transaksi node-postgres, `.for("update")`, `onConflictDoUpdate` | Dibaca; `uuid().defaultRandom()` dan `uniqueIndex` dicek di `node_modules/drizzle-orm` |
| `node:crypto` di Node 24.22.1 | `randomInt`, `timingSafeEqual` tersedia | Dicek |
| Praktik umum (anti enumerasi, prefix `__Host-`, logout POST, SPF/DKIM/DMARC, entropi token) | — | Tidak dikutip dari dokumen yang dibuka di sesi ini |
| UU PDP No. 27/2022 | — | **Belum dibuktikan** kesesuaian kebijakan retensi |
| HTTPS pada `dev.nbytes.id` | — | **Belum dibuktikan** |
