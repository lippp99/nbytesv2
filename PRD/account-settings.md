# PRD: Account Settings tersambung ke backend

| | |
|---|---|
| Status | v2, disetujui owner 2026-11-09 dan dikerjakan (§10). S6: hanya sidebar kiri bawah; Playground dan Quick Start nanti |
| Tanggal | 2026-11-09 |
| Repo / branch | `nbytesv2` / `develop` (setelah commit `9d6a14a`) |
| Cakupan | Halaman `/settings`: hapus mock, hapus form organisasi, profil (nama depan/belakang) tersimpan di DB, email dari sesi, keamanan endpoint |
| Di luar cakupan | Ganti email, organisasi/tim, 2FA/passkey, billing |

Aturan baca: klaim tentang kode, DB, dan docs berasal dari file yang dibuka di sesi ini (§11). Praktik keamanan yang tidak dikutip dari dokumen yang dibuka ditandai **(praktik umum)**. Yang tidak bisa dibuktikan ditandai **belum dibuktikan**.

---

## 1. Ringkasan

Halaman Account Settings saat ini 100% mock: nilai awal dari `dashboard-data.ts`, tombol simpan hanya menampilkan "Mode demo". PRD ini menyambungkannya ke data pengguna yang sebenarnya, dengan form sesedikit mungkin:

1. **Profil**: nama depan (wajib) dan nama belakang (opsional), bisa diubah dan disimpan ke `users`.
2. **Email**: tampil dari sesi, read-only.
3. **Keamanan**: tautan ke halaman Active Sessions yang sudah ada.
4. **Organisasi**: dihapus seluruhnya.
5. **Hapus akun**: tetap nonaktif sampai billing ada (alasan di S5).

---

## 2. Kondisi sekarang (bukti)

| Hal | Isi kode / DB sekarang | Dampak |
|---|---|---|
| Halaman | `src/app/(dashboard)/settings/page.tsx` merender `SettingsView` tanpa data | Halaman harus membaca sesi (di balik `<Suspense>`, §6) |
| View | `settings-view.tsx` (client): `useState(account.userName)`, `useState(account.name)`, simpan hanya `setSaved(true)` | Diganti data nyata + panggilan API |
| Form organisasi | Section "Organisasi", field "Nama tim" (`set-team`, `autoComplete="organization"`) | Dihapus (permintaan owner) |
| Copy | `settings-copy.ts`: sub "Profil, organisasi, dan keamanan akun."; profil "Nama Anda tampil di log aktivitas dan undangan tim."; `saved: "Mode demo..."` | Teks tentang organisasi, undangan tim, dan mode demo tidak benar lagi → diganti |
| Satu field "Nama" | Form punya satu field `Nama`, maks 60 karakter | Register sekarang memakai nama depan + belakang (maks 50, `isValidName` di `auth-contract.ts`). Settings disamakan |
| Mock `account` | `dashboard-data.ts`: `name: "Tim Anda"`, `userName: "Rina Wulandari"`, `email: "anda@perusahaan.example"`, `plan`, `billingPeriod` | Dipakai juga oleh: `header-breadcrumb.tsx` (`account.name`), `sidebar-user.tsx`, `sidebar-rail.tsx`, `quick-start-view.tsx`, `chat-log.tsx` (nama/email), `billing-view.tsx` (`plan`) |
| DB `users` (lokal, dicek dengan `psql`) | Kolom: `id, email, status, email_verified_at, terms_accepted_at, terms_version, last_login_at, created_at, first_name, last_name`. Tidak ada kolom organisasi | Tidak perlu migrasi untuk profil |
| Tabel DB | Hanya `users, otp_challenges, sessions, auth_rate_limits, auth_events` | Belum ada tabel organisasi, API key, saldo, atau tagihan |
| Sesi | `readSession()` (`session.ts`) memakai React `cache()` per request dan mengembalikan `{ id, email }` | Ditambah `firstName`, `lastName` |
| Pola endpoint | `api/auth/sessions/revoke/route.ts`: `readGuardedJson` (Origin + JSON + 1 KB) → `readSession` → parse kontrak → query yang dibatasi `user.id` → `authJson` / `authErrorResponse` | Dipakai ulang persis |
| PRD auth §17 | "hapus akun (wajib verifikasi ulang dengan kode baru), ganti email, ... organisasi/tim" di luar cakupan | Konsisten dengan S2, S3, S5 |
| PRD auth §13 | Sidebar seharusnya memakai identitas dari sesi; **kode sekarang masih mock** | Lihat §3 S6 (keputusan owner) |

---

## 3. Form dan keputusan yang diusulkan

| # | Bagian | Usulan | Alasan |
|---|---|---|---|
| S1 | Profil | Field **Nama depan** (wajib, placeholder "John") dan **Nama belakang** (opsional, label "(opsional)", placeholder "Doe"). Aturan sama dengan register: `isValidName`, maks 50, spasi dirapikan, nama belakang kosong → `null`. Satu tombol "Simpan perubahan", nonaktif bila tidak ada perubahan. | Satu sumber validasi (`architecture.md` §3: validasi sekali di kontrak). Konsisten dengan form register. |
| S2 | Email | Tampil dari sesi, **read-only**, hint tetap "Email dipakai untuk masuk dengan kode. Hubungi kami untuk menggantinya." | Ganti email yang aman butuh: kode OTP ke email baru, pemberitahuan ke email lama, cek email baru belum dipakai tanpa membocorkan pendaftaran, dan pencabutan sesi lain **(praktik umum)**. Itu fitur tersendiri; PRD auth §17 juga menaruhnya di luar cakupan. |
| S3 | Organisasi | **Dihapus**: section, field, copy, state `team`. Breadcrumb header (`header-breadcrumb.tsx`) tidak lagi menampilkan `account.name` ("Tim Anda"); hanya nama halaman. `account.name` dihapus dari mock. | Permintaan owner. Tidak ada konsep organisasi di DB, jadi teks "Tim Anda" di header juga mock. |
| S4 | Keamanan | Section "Keamanan" berisi satu baris: "Lihat dan keluarkan perangkat yang sedang masuk." + tautan ke `/sessions`. | Fitur sudah ada (PRD active-sessions). Tidak menduplikasi daftar sesi. |
| S5 | Hapus akun | **Diaktifkan atas keputusan owner (2026-11-09), detail di §12.** Popup konfirmasi: ketik "hapus akun", lalu kode OTP ke email, lalu akun dihapus. | Owner memilih mengaktifkan. Risiko saldo prabayar belum berlaku karena DB belum punya tabel saldo, key, atau pemakaian (dicek); wajib ditinjau ulang saat billing dibuat. Verifikasi ulang dengan kode OTP baru bertujuan khusus (PRD auth §17). |
| S6 | Identitas di shell | **Diputuskan owner:** hanya sidebar kiri bawah (nama + email di panel, avatar inisial + tooltip di rail) dari sesi. Sapaan Quick Start dan inisial Playground tetap mock untuk sekarang. Akun lama tanpa nama: tampil email. | Setelah menyimpan nama di Settings, sidebar ikut berubah. `SidebarContent` adalah komponen client, jadi bagian user dikirim sebagai slot komponen server dari `sidebar.tsx`, masing-masing di balik `<Suspense>` (komposisi server → client). Pola context + `use()` dari docs tidak dipakai karena promise harus dibuat di dalam batas Suspense, sedangkan sidebar dirender di dua tempat (desktop dan drawer). |

---

## 4. Kontrak API

### 4.1 `POST /api/account/profile`

| | |
|---|---|
| Header wajib | `Origin` = `APP_URL`, `Content-Type: application/json`, body ≤ 1 KB (sama dengan endpoint auth) |
| Body | `{ "firstName": string, "lastName": string \| null }` |
| 200 | `{ "ok": true, "profile": { "firstName": string, "lastName": string \| null } }` (nilai yang sudah dirapikan) |
| 400 | `invalid_input` (nama tidak valid, field asing tidak dipakai) |
| 401 | `unauthorized` (tidak ada sesi valid, sesi kedaluwarsa, atau akun ditangguhkan) |
| 403 | Origin/Content-Type salah, body `unavailable` |
| 429 | `rate_limited` + `retryAfterMinutes` |
| 503 | `unavailable` |

Semua respons `Cache-Control: no-store` (`authJson`). Bentuk error sama dengan kontrak auth, jadi `updateProfile()` ditaruh di `auth-client.ts` dan memakai pemetaan error yang sama (tidak disalin).

### 4.2 Validasi

`parseProfileBody(json)` di `src/lib/auth/auth-contract.ts` (berkas yang sudah memegang validasi nama) memakai `isValidName` / `normalizeName`:
- `firstName` wajib valid.
- `lastName`: `undefined` / `null` / kosong / spasi → `null`; selain itu wajib valid (sama dengan `parseAccount` register).
- Hanya dua field ini yang dibaca; field lain (`email`, `status`, `id`) diabaikan.

### 4.3 Membaca data

Tidak ada endpoint GET. Halaman server membaca `readSession()` dan mengirim DTO sempit `{ firstName, lastName, email }` ke view (docs `data-security.md`: kirim hanya field yang dibutuhkan).

---

## 5. Keamanan

| Ancaman | Kontrol | Sumber |
|---|---|---|
| Endpoint dipanggil tanpa login | `readSession()` di setiap request, tanpa cache lintas request; tidak ada sesi → 401 | docs `data-security.md`: "always re-verify" di setiap entry point |
| Mengubah profil orang lain (IDOR) | `UPDATE users ... WHERE id = session.user.id`. ID **tidak pernah** diambil dari body | docs `data-security.md` (IDOR, OWASP) |
| Mass assignment (mengubah `email`/`status` lewat body) | Hanya `firstName`, `lastName` yang diparse dan ditulis | (praktik umum, OWASP) |
| CSRF | Origin wajib = `APP_URL`, `Content-Type: application/json` wajib, cookie `SameSite=Lax`, hanya `POST` | `request-guard.ts`; docs `serverActions.md` (cek Origin bawaan hanya untuk Server Actions, bukan Route Handler) |
| Input berbahaya / XSS | Validasi `isValidName` (hanya huruf, spasi, `'` `’` `-` `.`, maks 50); React meng-escape output; tidak ada `dangerouslySetInnerHTML` | `auth-contract.ts` + test |
| Body besar / DoS ringan | Batas 1 KB (`readGuardedJson`); rate limit **10 simpan per user per jam** (usulan) lewat `hit()` yang sudah ada | `rate-limit.ts` |
| Akun ditangguhkan tetap bisa mengubah | `readSession()` mengembalikan `null` untuk status selain `active` → 401 | `session.ts` |
| Kebocoran lewat log | Tidak mencatat nama atau email; audit `profile_updated` hanya `email_hash`, `ip_hash`, `user_id` | `auth-events.ts`, `backend-security.md` |
| Kebocoran lewat cache | `Cache-Control: no-store`; tidak ada data pengguna di key `use cache` | docs `authentication-with-cache-components.md` |
| Error detail ke klien | `authErrorResponse`: hanya kode generik, detail di log server | `request-guard.ts`, `backend-security.md` |

---

## 6. Perilaku UI (aturan `dashboard-design.md`)

- Pola halaman Forms: label di atas field, error di bawah field yang salah (§6).
- Komponen app-kit yang sudah ada: `PageHeader`, `Card`, `Field`, `TextInput`, `primaryAction`, `secondaryAction`.
- State tombol simpan: default; nonaktif bila tidak ada perubahan; loading ("Menyimpan…", `aria-busy`); sukses ("Perubahan tersimpan.", `role="status"`); error umum (`role="alert"`).
- `401 unauthorized` → `router.push("/login?next=%2Fsettings")` (pola `sessions-view.tsx`).
- Setelah sukses: `router.refresh()` agar data server ikut baru (pola `sessions-view.tsx`).
- Halaman membaca sesi di balik `<Suspense>` dengan skeleton (docs: membaca `cookies()` di luar Suspense adalah build error saat Cache Components aktif; `dashboard-design.md` §8: loading pakai skeleton).
- Copy baru (bahasa Indonesia, judul tetap "Account Settings"): sub "Profil dan keamanan akun Anda."; profil "Nama Anda tampil di dashboard dan email dari nbytes."

---

## 7. Perubahan file (sesuai `architecture.md`)

| File | Perubahan |
|---|---|
| `src/app/(dashboard)/settings/page.tsx` | Baca `readSession()` di komponen dalam `<Suspense>`, redirect ke `/login?next=%2Fsettings` bila `null`, kirim DTO ke view |
| `src/app/api/account/profile/route.ts` | **Baru.** Guard → sesi → `parseProfileBody` → `updateProfile` → `authJson` |
| `src/lib/server/account/profile.ts` | **Baru**, `server-only`. Rate limit per user, `UPDATE ... WHERE id`, audit event |
| `src/lib/auth/auth-contract.ts` (+ test) | Tipe `Profile`, `parseProfileBody` (dipakai bersama dengan register) |
| `src/lib/auth/auth-client.ts` | `updateProfile()` |
| `src/lib/display-name.ts` (+ test) | **Baru.** `displayName`, `initialsOf` (fallback ke email untuk akun lama tanpa nama) |
| `src/lib/server/auth/session.ts` | `SessionUser` + `firstName`, `lastName` |
| `src/lib/server/auth/auth-events.ts` | Tipe event `profile_updated` |
| `src/components/dashboard/settings/settings-view.tsx` | Komponen server: section Profil, Keamanan, Hapus akun (nonaktif). Mock dan organisasi dihapus |
| `src/components/dashboard/settings/profile-form.tsx` | **Baru**, client: nama depan/belakang, email read-only, simpan |
| `src/components/dashboard/settings/settings-copy.ts` | Copy baru (§6), hapus `org*`, `saved` demo |
| `src/components/dashboard/settings/settings-skeleton.tsx` | **Baru.** Fallback Suspense |
| `src/components/dashboard/shell/header-breadcrumb.tsx` | Hapus `account.name` (S3) |
| `src/components/dashboard/shared/dashboard-data.ts` | Hapus `account.name`. `userName`/`email` tetap untuk Quick Start dan Playground (S6) |
| `shell/sidebar/sidebar.tsx` | **Baru**, server: `SidebarContent` + slot user dan avatar di balik `<Suspense>` |
| `shell/sidebar/sidebar-user.tsx` | Komponen server dari sesi: `SidebarUser`, `RailAvatar`, dan skeleton-nya |
| `shell/sidebar/sidebar-content.tsx`, `sidebar-rail.tsx` | Menerima slot `user` / `avatar`; mock dihapus |
| `src/app/(dashboard)/layout.tsx`, `shell/app-header.tsx` | Merender `<Sidebar />` (desktop dan drawer mobile) |

Tidak ada perubahan skema DB. Setelah file baru: `npm run map`.

---

## 8. Pengujian

Unit test (`node:test`):
- `parseProfileBody`: valid, nama belakang kosong/null/spasi → `null`, nama tidak valid, field asing diabaikan, bukan objek.

Integration (DB lokal + dev server, tanpa mengirim email):
- Tanpa cookie → 401. Origin salah → 403. Content-Type salah → 403.
- Simpan valid → 200, baris `users` milik sesi berubah, baris user lain tidak berubah.
- Body berisi `email`/`status`/`id` → kolom itu tidak berubah.
- Nama belakang kosong → `last_name` = `NULL`.
- 11× simpan dalam satu jam → 429.
- User `suspended` → 401.
- `/settings` tanpa sesi → redirect `/login?next=%2Fsettings`; dengan sesi → nama dan email nyata tampil di HTML.

Kriteria selesai:
- [ ] Tidak ada impor `dashboard-data` di `settings/*`; tidak ada teks "organisasi", "tim", atau "Mode demo" di Settings.
- [ ] `npx tsc --noEmit`, `npm run lint`, semua test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing (`dashboard-design.md` §2) bersih.

---

## 9. Risiko

- `readSession()` di halaman dan di layout memakai React `cache()`, jadi satu query per request (sudah begitu sekarang).
- Bila S6 = A, nama di sidebar tetap mock sampai dikerjakan.
- Rate limit memakai tabel Postgres yang sama dengan auth (`shortcut:` yang sudah dicatat di `rate-limit.ts`).

---

## 10. Keputusan yang dibutuhkan dari owner

Dijawab 2026-11-09: form final disetujui; S6 hanya sidebar kiri bawah (Quick Start dan Playground nanti). Tidak ada keberatan, jadi usulan dipakai: ganti email ditunda, hapus akun tetap nonaktif, rate limit 10 simpan per jam per user.

Masih terbuka: kapan sapaan Quick Start dan inisial Playground disambungkan; kapan ganti email dan hapus akun dikerjakan.

---

## 11. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `settings/page.tsx`, `settings-view.tsx`, `settings-copy.ts` | form, mock, copy | Dibaca utuh |
| `dashboard-data.ts` + grep pemakai `account.*` | sebaran mock | Dibaca / grep |
| `sidebar-user.tsx`, `header-breadcrumb.tsx`, `sidebar-content.tsx` (client), `app-kit/field.tsx` | identitas shell, komponen form | Dibaca |
| `session.ts`, `request-guard.ts`, `rate-limit.ts`, `auth-events.ts`, `api/auth/sessions/revoke/route.ts`, `api/auth/logout/route.ts`, `sessions-view.tsx`, `sessions/page.tsx`, `layout.tsx` | pola endpoint, sesi, Suspense, refresh | Dibaca |
| `auth-contract.ts` (`isValidName`, `normalizeName`) | validasi nama | Dibaca, dipakai di sesi ini |
| DB lokal (`psql \d users`, daftar tabel schema) | kolom dan tabel | Dicek |
| `PRD/backend-auth-user.md` (utuh), `PRD/admin-console.md` (grep saldo/refund) | batas cakupan, saldo | Dibaca |
| Docs Next 16.4.5 terpasang: `02-guides/data-security.md` (re-verify, IDOR, DAL mutasi), `authentication-with-cache-components.md` (Suspense, `use cache: private`, context + `use()`) | aturan keamanan dan sesi | Dibaca dari `node_modules/next/dist/docs` |
| `.claude/rules/*`, `AGENTS.md` | aturan proyek | Dibaca |
| Praktik umum (mass assignment, alur ganti email) | — | Tidak dikutip dari dokumen yang dibuka |
| UU PDP No. 27/2022 (retensi saat hapus akun) | — | **Belum dibuktikan** |

---

## 12. Hapus akun (tambahan v3, owner 2026-11-09)

### 12.1 Alur

```
Klik "Hapus akun" -> popup (alertdialog)
  Langkah 1: ketik "hapus akun" (tanpa beda huruf besar/kecil, spasi di tepi diabaikan)
             -> POST /api/account/delete/request { confirm }   kode 8 digit ke email akun
  Langkah 2: masukkan kode
             -> POST /api/account/delete { confirm, code }
             -> user dihapus, semua sesi ikut terhapus (FK cascade), cookie dihapus -> ke "/"
```

Alasan dua langkah: frasa mencegah klik tidak sengaja; kode OTP membuktikan pemilik email masih memegang akun, jadi
cookie sesi yang dicuri atau laptop yang ditinggal dalam keadaan login tidak cukup untuk menghapus akun
(PRD auth §17; **(praktik umum: re-autentikasi untuk aksi sensitif)**).

### 12.2 Kontrak

| Endpoint | Body | Sukses | Error |
|---|---|---|---|
| `POST /api/account/delete/request` | `{ confirm: "hapus akun" }` | 202 `{ ok, resendAfter: 60 }` | 400 `invalid_input`, 401, 403, 429, 503 |
| `POST /api/account/delete` | `{ confirm, code }` | 200 `{ ok }` + cookie dihapus | 400, 401, 401 `invalid` + `attemptsLeft`, 410 `expired`, 429, 403 |

### 12.3 Aturan server

- Kode: tabel `otp_challenges` yang sama, `purpose = "account-delete"`. HMAC memakai prefix tujuan, jadi kode login tidak bisa dipakai untuk menghapus akun dan sebaliknya. TTL 10 menit, 5 percobaan, sekali pakai, baris dikunci (`FOR UPDATE`), sama dengan login (logika dipakai bersama, tidak disalin).
- Email kode selalu ke email akun dari sesi, tidak pernah ke alamat dari body.
- Rate limit: kirim kode 1 per 60 detik dan 5 per jam per user; verifikasi ikut batas 30 per jam per IP yang sudah ada.
- Yang dihapus: baris `users` (sesi ikut terhapus lewat `ON DELETE CASCADE`), semua `otp_challenges` email itu. `auth_events` tetap, `user_id` menjadi `NULL` (`ON DELETE SET NULL`), hanya hash email/IP. Event `account_deleted` dicatat tanpa `user_id`.
- Setelah itu email yang sama boleh mendaftar lagi sebagai akun baru.
- Kesesuaian dengan UU PDP: **belum dibuktikan**.

### 12.4 Popup (responsif)

- Primitive `ui/alert-dialog` (Base UI AlertDialog, ditambah lewat CLI shadcn): `role="alertdialog"`, fokus terkunci di dalam, Escape menutup, klik di luar tidak menutup.
- Lebar: penuh dikurangi 16px tiap sisi di HP; maksimal 448px dari 640px ke atas.
- Posisi: di HP menempel 16px dari atas, supaya input tidak tertutup keyboard; dari 640px ke atas di tengah layar. Tinggi maksimal layar dikurangi 32px, isi bisa digulir.
- Tombol: di HP bertumpuk penuh lebar (aksi utama di atas); dari 640px ke atas sejajar di kanan.
- Token dashboard: `app-raised` + bayangan `app-raised`, sudut 16px, backdrop `app-scrim` + blur 10px (sama dengan drawer). Tanpa animasi gerak saat `prefers-reduced-motion`.
- Tidak bisa ditutup selama request berjalan. Error tampil di bawah field yang salah.

### 12.5 Berkas (dikerjakan)

| Berkas | Isi |
|---|---|
| `src/lib/server/auth/otp/challenge.ts` | **Baru.** `otpHash`, `issueChallenge`, `dropChallenge`, `consumeChallenge` per tujuan; dipakai login dan hapus akun (logika lama dipindah, tidak disalin) |
| `src/lib/server/auth/otp/request-code.ts`, `verify-code.ts` | Memakai `challenge.ts`; perilaku login tidak berubah (uji ulang 18 cek E2E lolos) |
| `src/lib/server/auth/otp/otp-rules.ts`, `auth-email.ts` (+ test) | `DELETE_PURPOSE`, batas kirim, jenis email `delete_account` |
| `src/lib/server/account/delete-account.ts` | **Baru.** `requestDeleteCode`, `deleteAccount` |
| `src/app/api/account/delete/request/route.ts`, `src/app/api/account/delete/route.ts` | **Baru.** Route handler |
| `src/lib/auth/auth-contract.ts` (+ test), `auth-client.ts` | Frasa konfirmasi dan parser body; `requestDeleteCode`, `deleteAccount` |
| `src/components/ui/alert-dialog.tsx` | **Baru**, lewat `npx shadcn@latest add alert-dialog` (tidak diedit tangan) |
| `src/components/dashboard/settings/delete-account-dialog.tsx` | **Baru.** Popup dua langkah |
| `settings-view.tsx`, `settings-copy.ts`, `profile-form.tsx` | Tombol aktif, copy popup, `errorText` dipakai bersama |
| `src/app/globals.css` | Backdrop `alert-dialog-overlay` = `app-scrim` + blur (blok dashboard saja, bukan `:root`/`.dark`) |

Pengujian: 20 cek E2E hapus akun dengan mailer console (`EMAIL_PROVIDER=console` hanya di proses dev, `.env.local` tidak
diubah). Breakpoint popup dicek dari CSS yang dilayani dev server. Tampilan di browser **belum dicek**.
