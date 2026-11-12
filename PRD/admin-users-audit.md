# PRD: Admin Pengguna dan Audit log (data nyata)

| | |
|---|---|
| Status | v3. U1–U5 diputuskan owner 2026-11-12 (§9) dan **dibangun** hari itu (§11). Terbuka: U6, U7. |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | Halaman admin `/admin/users` (daftar akun, tangguhkan/aktifkan) dan `/admin/audit` (riwayat aksi admin) memakai data DB, beserta endpoint dan perubahan skema yang dibutuhkan |
| Di luar cakupan | Halaman detail pengguna, kredit/refund saldo manual, ekspor CSV, notifikasi peringatan (sesuai `PRD/backend-auth-admin.md` A.14); paket langganan; halaman admin lain |
| Bergantung pada | `PRD/backend-auth-admin.md` (§13 audit, A.7 menu, C5, C9), `PRD/backend-auth-user.md` (status `suspended`), `PRD/gateway-pricing-billing.md` (saldo), `PRD/gateway-api.md` (key API, `gateway_requests`) |

Setiap klaim tentang kode berasal dari berkas yang dibuka saat PRD ini ditulis (§10). Yang tidak bisa dibuktikan ditandai
**belum dibuktikan**; bagian **usulan** bisa diganti owner.

---

## 1. Kondisi saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Halaman Pengguna | **Mock penuh.** 7 akun contoh di kode; kolom Paket, Saldo, Pemakaian bulan ini, Status, Daftar. Tombol Tangguhkan hanya mengubah state di browser; catatan "Mode demo: perubahan tidak disimpan" | `src/components/admin/users/users-data.ts`, `users-view.tsx`, `users-copy.ts`; `src/app/admin/(console)/users/page.tsx` tidak membaca DB |
| Halaman Audit log | **Mock penuh.** 8 baris contoh: waktu, admin (email), aksi (`provider.disable`, `user.suspend`, `payment.refund`, ...), target, IP asli | `src/components/admin/audit/audit-data.ts`, `audit-view.tsx` |
| Tabel `users` | `email` (teks biasa), `first_name`, `last_name`, `status` hanya `active`/`suspended` (CHECK), `email_verified_at`, `last_login_at`, `created_at` | `src/lib/server/db/schema/auth.ts` |
| Tabel `admin_audit_events` | `admin_id`, `type`, `target`, `email_hash`, `ip_hash`, `created_at`. Email dan IP **disimpan sebagai HMAC**, bukan teks | `src/lib/server/db/schema/admin.ts`, `PRD/backend-auth-admin.md` §13 |
| Jenis audit admin yang sudah ditulis kode | Login: `code_sent`, `code_send_failed`, `code_failed`, `totp_failed`, `login_success`, `logout`, `totp_enrolled`, `backup_code_used`, `invited`, `locked`. Aksi: `exchange_rate_set` (target = id baris kurs), `model_price_set`, `model_disabled` (target = id model) | `src/lib/server/admin-auth/audit.ts`, `login/*.ts`, `payments/exchange-rate.ts`, `gateway/catalog-admin.ts` |
| Isi DB lokal saat ini | `users`: 1 baris `active`. `admin_audit_events`: `invited` 1, `code_sent` 2, `login_success` 2, `totp_enrolled` 1 | query `count(*)` ke DB lokal, 2026-11-12 |
| Log auth pengguna | Tabel `auth_events` (16 jenis, mis. `login_success`, `otp_failed`, `blocked_suspended`, `account_deleted`), email dan IP juga HMAC | `src/lib/server/auth/auth-events.ts`, `schema/auth.ts` |
| Efek status `suspended` yang sudah jalan | Sesi dashboard ditolak (`readSession`), login mengirim email penangguhan, key API ditolak `403 account_suspended` | `src/lib/server/auth/session.ts`, `otp/request-code.ts`, `gateway/api-keys.ts` |
| Fungsi keluar semua perangkat | `deleteUserSessions(userId)` ada, belum dipanggil oleh fitur apa pun | `src/lib/server/auth/session.ts` |
| Endpoint admin pengguna/audit | **Belum ada.** `src/app/api/admin/` hanya `auth/*`, `exchange-rate`, `models` | `ls src/app/api/admin` |

**Selisih mock dengan data nyata** (mock tidak boleh dijadikan acuan):

1. **Paket** (Gratis/Pro/Tim): tidak ada di skema mana pun. Billing prabayar tanpa langganan; "paket langganan bulanan" di luar
   cakupan `gateway-pricing-billing.md`. Kolom ini dihapus.
2. **Status "Belum verifikasi"** (`pending`): tidak ada; akun baru dibuat hanya setelah kode email benar
   (`PRD/backend-auth-user.md` §16 menyatakan `pending` tidak dibutuhkan). Dihapus.
3. **IP asli** di audit: tidak disimpan, hanya HMAC. Lihat keputusan U3.
4. **Email admin** di kolom Admin: satu Owner (C9), dan `admin_id` menunjuk ke `admins.email`, jadi email Owner bisa ditampilkan.
5. **Nama aksi** mock (`provider.disable`, `payment.refund`, `admin.invite`, `model.price_update`) tidak sama dengan jenis di
   kode; `provider.disable` dan `payment.refund` tidak punya fitur di backend.

## 2. Tujuan

1. Owner melihat semua akun nyata, mencarinya, dan menangguhkan atau mengaktifkan akun dengan efek yang benar-benar berlaku.
2. Owner melihat riwayat aksi admin yang nyata dan tidak bisa diubah dari aplikasi.
3. Tidak ada data contoh yang tampil seolah nyata.

## 3. Halaman Pengguna (`/admin/users`)

### 3.1 Kolom (U1, U2 diputuskan)

| Kolom | Sumber | Catatan |
|---|---|---|
| Pengguna | `users.first_name` + `last_name`, `users.email` | Nama kosong untuk akun lama (sebelum tab daftar) → tampil email saja |
| Status | `users.status` | Badge titik + kata: Aktif / Ditangguhkan |
| Saldo | `user_balances.balance_micros` (dan `held_micros` bila > 0) | Tanpa baris = $0; boleh negatif kecil (B7) |
| Pemakaian bulan ini | `sum(gateway_requests.charge_micros)` sejak tanggal 1 bulan ini (UTC) | Saat ini selalu $0 sampai ada request nyata |
| Key aktif | `count(api_keys where revoked_at is null)` | Membantu menilai dampak penangguhan |
| Login terakhir | `users.last_login_at` | |
| Daftar | `users.created_at` | |
| Aksi | Tangguhkan / Aktifkan | §3.3 |

Satu query dengan join dan agregat per halaman; tanpa N+1.

### 3.2 Cari, saring, halaman

- Cari di server (`?q=`), mencocokkan email dan nama tanpa beda huruf besar/kecil. Saring status (`?status=all|active|suspended`)
  dengan kontrol Segmented, disimpan di URL seperti filter deposit (`deposit-filter.tsx`).
- 25 akun per halaman (usulan), urut terbaru daftar dulu, pola halaman seperti `listDeposits`.
- Kosong: "Belum ada pengguna" atau "Tidak ada yang cocok" dengan langkah berikutnya.

### 3.3 Tangguhkan dan aktifkan

Alur (usulan):

1. Owner menekan Tangguhkan → dialog konfirmasi menyebut email akun dan efeknya (A.7: aksi berisiko minta konfirmasi).
2. `POST /api/admin/users/{id}/status` dengan body `{ status: "suspended" | "active", reason }`. Cek Origin, sesi admin,
   validasi di kontrak (`src/lib/admin-users/...-contract.ts`).
3. Server dalam **satu transaksi**: ubah `users.status`, hapus semua sesi pengguna (`deleteUserSessions`), tulis audit
   `user_suspended` / `user_restored` dengan target = id pengguna.
4. Efek yang sudah otomatis ikut dari kode yang ada: login ditolak, key API ditolak 403, dashboard keluar.

Yang **tidak** berubah saat ditangguhkan (U4 diputuskan): saldo tetap, key API tidak dicabut (hanya ditolak selama
ditangguhkan), deposit `pending` tetap bisa dikreditkan oleh webhook, request yang sedang berjalan selesai seperti biasa
(**belum dibuktikan**: request streaming yang sedang berjalan tidak dihentikan saat status berubah).

## 4. Halaman Audit log (`/admin/audit`)

### 4.1 Isi (usulan)

| Kolom | Sumber | Catatan |
|---|---|---|
| Waktu (UTC) | `created_at` | |
| Admin | `admins.email` lewat `admin_id`; kosong → "—" | Event sebelum login (mis. `code_failed` untuk email tak dikenal) tidak punya admin |
| Aksi | `type`, ditampilkan sebagai kalimat Indonesia (mis. `exchange_rate_set` → "Mengubah kurs") | Daftar terjemahan di kontrak, satu per jenis |
| Target | `target`, dibaca sesuai jenis: id model, nilai kurs (join `exchange_rates`), email pengguna (join `users`) | Target yang barisnya sudah tidak ada → id saja |
| Alasan | kolom baru `reason` (U5) | Hanya untuk aksi yang mewajibkan alasan |
| IP | lihat U3 | |

- Saring per grup: Semua / Login admin / Aksi admin (usulan). Urut terbaru, 50 per halaman.
- Hanya baca. Tidak ada tombol ubah atau hapus.

### 4.2 Jenis audit yang wajib ditulis

Sudah ada: semua jenis di §1. Baru dari PRD ini: `user_suspended`, `user_restored`. Setiap fitur admin berikutnya
(kredit manual, pengaturan) wajib menambah jenisnya sendiri.

### 4.3 Append-only

Aplikasi hanya `INSERT` (sudah). Trigger DB yang menolak `UPDATE`/`DELETE` (usulan `backend-auth-admin.md` §13) **tidak bisa**
dibuat dengan aturan saat ini: drizzle-kit tidak membuat trigger dari skema, dan berkas di `drizzle/` tidak boleh disunting
tangan. Pilihan: tetap tanpa trigger, atau owner mengizinkan migrasi kustom (U6).

### 4.4 Log auth pengguna (`auth_events`)

Tidak ditampilkan di Audit log (usulan): isinya aksi pengguna sendiri, bukan admin, jumlahnya jauh lebih banyak (118 baris
di DB lokal), dan email-nya hanya HMAC. Tempat yang cocok adalah halaman detail pengguna (di luar cakupan, A.14).

## 5. Endpoint dan berkas (usulan, sesuai `architecture.md`)

| Isi | Lokasi |
|---|---|
| Halaman | `src/app/admin/(console)/users/page.tsx`, `audit/page.tsx` (Server Component + `Suspense`, `getCurrentAdmin()` di samping data seperti halaman Keuangan) |
| Daftar dan ubah status pengguna | `src/lib/server/account/user-admin.ts` (domain `account` yang sudah ada; `import "server-only"`); route `src/app/api/admin/users/[id]/status/route.ts` |
| Daftar audit | `src/lib/server/admin-auth/audit-list.ts` |
| Kontrak + klien pengguna | `src/lib/admin-users/user-admin-contract.ts` (+ test), `user-admin-client.ts` (folder baru: 3 berkas) |
| Kontrak audit | `src/lib/admin-auth/audit-contract.ts` (label aksi, filter, halaman) |
| UI | `src/components/admin/users/*`, `src/components/admin/audit/*`; `users-data.ts` dan `audit-data.ts` dihapus |

## 6. Skema (bergantung keputusan)

| Perubahan | Untuk | Keputusan |
|---|---|---|
| `admin_audit_events.reason` text nullable | Alasan penangguhan | U5 (diputuskan) |
| `admin_audit_events.ip_masked` text nullable | IP yang bisa dibaca (disamarkan), diisi untuk semua event baru termasuk login admin | U3 (diputuskan) |
| Indeks `users.created_at` | Urutan daftar | teknis |

Migrasi lewat `npm run db:generate` → tinjau SQL → `npm run db:migrate` ke DB lokal saja.

## 7. Keamanan

- Semua query dan endpoint memeriksa sesi admin di server; halaman memanggil `getCurrentAdmin()` di samping data.
- Endpoint ubah status: cek Origin, JSON, body kecil (`readGuardedJson`), id UUID, hanya `active` ↔ `suspended`.
- Tidak menampilkan hash, token, atau isi sesi. Email pengguna tampil penuh hanya untuk Owner.
- Ubah status dan audit dalam satu transaksi: tidak ada penangguhan tanpa jejak.

## 8. Kriteria selesai

- Tidak ada lagi `users-data.ts` dan `audit-data.ts`; tidak ada teks "Mode demo" di dua halaman ini.
- Tangguhkan → sesi pengguna hilang, login ditolak, key API 403, baris audit ada; Aktifkan → bisa login lagi.
- `npx tsc --noEmit`, `npm run lint`, test lolos; diuji lewat HTTP di DB lokal; data uji dihapus.

## 9. Keputusan yang dibutuhkan

| # | Pertanyaan | Usulan |
|---|---|---|
| U1 | Kolom "Paket" dihapus karena paket tidak ada? | **Diputuskan:** hapus |
| U2 | Kolom tambahan Key aktif dan Login terakhir? | **Diputuskan:** ya |
| U3 | IP di audit: sekarang hanya HMAC. Tampilkan apa? | **Diputuskan:** simpan IP disamarkan (`103.47.xx.xx`, fungsi `maskIp` yang sudah ada, sama seperti halaman Active Sessions) untuk event baru; event lama tampil "—". IP hanya terbaca bila `AUTH_TRUSTED_IP_HEADER` diisi (di dev kosong → "—") |
| U4 | Saat ditangguhkan: key API dicabut permanen atau hanya ditolak sementara? | **Diputuskan:** hanya ditolak (sudah begitu di kode); aktif lagi → key jalan lagi |
| U5 | Alasan wajib saat menangguhkan? | **Diputuskan:** wajib, maks 200 karakter, disimpan di audit (kolom `reason`) |
| U6 | Trigger DB append-only lewat migrasi kustom? | **Terbuka.** Usulan: tidak sekarang (aturan `drizzle/`); cukup aplikasi hanya `INSERT` |
| U7 | Retensi audit log (C5) | **Terbuka.** Tidak ada penghapusan otomatis sampai diputuskan |

## 11. Status pembangunan (2026-11-12)

Dibangun sesuai §3–§6: migrasi `drizzle/0009_serious_guardian.sql` (kolom `ip_masked`, `reason`, indeks
`users_created_at_idx`); `logAdminEvent` kini mengisi `ip_masked` untuk semua audit admin (login, kurs, model, status
akun) lewat `requestIpMasked()` di `request-guard.ts`; `src/lib/server/account/user-admin.ts`,
`src/lib/server/admin-auth/audit-list.ts`, route `POST /api/admin/users/{id}/status`; UI baru di
`src/components/admin/users/` dan `src/components/admin/audit/`; data contoh `users-data.ts` dan `audit-data.ts` dihapus.
Navigasi halaman dipindah ke `src/components/app-kit/pagination.tsx` (dipakai juga oleh tabel deposit).

Keputusan teknis saat membangun: menangguhkan akun yang sudah ditangguhkan (atau mengaktifkan yang sudah aktif) tidak
mengubah apa pun dan tidak menulis baris audit. Pencarian memperlakukan `%` dan `_` sebagai huruf biasa.

Diuji lewat HTTP ke DB lokal (22 cek): halaman tanpa sesi admin dialihkan, cari dan saring, tangguhkan tanpa alasan 400,
Origin lain 403, tanpa sesi admin 401, akun tak dikenal 404, sesi pengguna terhapus dan cookie lamanya ditolak,
audit tercatat dengan alasan dan IP disamarkan, aktifkan lagi, saringan Login/Aksi di Audit log. Belum dilihat di browser.

## 10. Sumber

- Kode: `src/components/admin/users/*`, `src/components/admin/audit/*`, `src/app/admin/(console)/users/page.tsx`,
  `audit/page.tsx`, `src/lib/server/db/schema/{auth,admin,billing,gateway}.ts`, `src/lib/server/admin-auth/audit.ts`,
  `src/lib/server/admin-auth/login/*.ts`, `src/lib/server/auth/{session,auth-events,client-info}.ts`,
  `src/lib/server/auth/otp/request-code.ts`, `src/lib/server/gateway/{api-keys,catalog-admin}.ts`,
  `src/lib/server/payments/exchange-rate.ts`, `src/components/admin/billing/deposit-filter.tsx`.
- PRD: `backend-auth-admin.md` (§13, §15 C5/C9, A.7, A.14), `backend-auth-user.md` (§16, status), `gateway-pricing-billing.md`
  (B6, B7), `gateway-api.md` (§5).
- DB lokal: hitungan baris `users`, `admin_audit_events`, `auth_events` (2026-11-12).
