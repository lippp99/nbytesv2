# PRD: Halaman Active Sessions (Perangkat yang Sedang Masuk)

| | |
|---|---|
| Status | v4, disetujui owner 2026-11-09 (§11). v1 di Settings; v2 halaman sendiri; v3 10 sesi per halaman + pagination; v4 negara + IP disamarkan; v5 negara tampil sebagai bendera, bukan teks (owner) |
| Tanggal | 2026-11-09 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | Halaman dashboard baru `/sessions` ("Active Sessions") di grup menu **Akun**: daftar perangkat yang sedang masuk, keluar dari satu perangkat, keluar dari semua perangkat lain |
| Di luar cakupan | Log login lengkap, IP lengkap, lokasi lebih rinci dari negara, notifikasi email login baru, percobaan login gagal, sesi admin (§12) |
| Bergantung pada | `PRD/backend-auth-user.md` (sudah diimplementasikan: tabel `sessions`, `readSession`, `deleteUserSessions`, `auth_events`) |

Aturan baca: setiap klaim tentang kode proyek berasal dari file yang dibuka saat PRD ini ditulis (§13). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**.

---

## 1. Ringkasan

Pengguna bisa melihat perangkat mana saja yang sedang masuk ke akunnya dan mengeluarkan perangkat yang tidak dikenal. Ini menutup PRD backend-auth-user §17 ("daftar perangkat dan keluar dari semua perangkat untuk pengguna").

Bentuknya **halaman sendiri** di dashboard, satu menu baru di grup **Akun** (di bawah Account Settings).

Prinsip:
- Data dari tabel `sessions`, ditambah dua kolom (`ip_masked`, `country`) lewat satu migrasi (v4).
- IP hanya disimpan dan ditampilkan **dalam bentuk disamarkan**; lokasi hanya **negara** dari Cloudflare (§3 S2, §6.6).
- Setiap aksi diotorisasi di server terhadap sesi yang sedang login; pengguna hanya bisa melihat dan mencabut sesinya sendiri.

---

## 2. Kondisi saat ini (bukti dari kode)

| Hal | Isi kode sekarang | Dampak |
|---|---|---|
| Data sesi | `sessions`: `id`, `user_id`, `token_hash`, `expires_at`, `last_seen_at`, `created_at`, `user_agent` (dipotong 256 karakter) | Cukup untuk daftar perangkat |
| Validitas sesi | `readSession()`: ditolak jika kedaluwarsa (30 hari), idle > 7 hari, atau user bukan `active` | Daftar memakai aturan yang sama |
| `last_seen_at` | Diperbarui paling sering 1× per jam (`TOUCH_EVERY_MS`) | "Terakhir aktif" presisinya per jam |
| Keluar semua | `deleteUserSessions(userId)` sudah ada, belum dipakai | Dipakai ulang dengan pengecualian sesi sekarang |
| Menu dashboard | `src/components/dashboard/shell/nav-items.ts`: grup "Mulai", "Kelola", "Akun"; grup Akun hanya berisi `/settings` "Account Settings". Ada test `nav-items.test.ts` | Item baru masuk grup Akun; test ditambah |
| Breadcrumb header | `header-breadcrumb.tsx` mengambil label lewat `activeItem(pathname)` | Otomatis tampil "Active Sessions" tanpa kode tambahan |
| Proteksi halaman | `src/proxy.ts` matcher berupa daftar literal; `DASHBOARD_PATHS` di `src/lib/auth/auth-contract.ts` (dipakai `safeNextPath`) | Keduanya wajib ditambah `/sessions` |
| Pola halaman | Route `src/app/(dashboard)/<page>/page.tsx` merender `components/dashboard/<page>/<page>-view.tsx` (mis. `usage/page.tsx`) | Ikuti pola yang sama |
| Komponen | `app-kit`: `PageHeader`, `Card`, `Table`/`THead`/`Th`/`Tr`/`Td`, `Badge`, `EmptyState`, `secondaryAction` | Dipakai, tidak membuat komponen baru |
| Format tanggal | `src/lib/date-format.ts` saat itu hanya `formatUtc` (UTC mentah; dihapus 2026-11-13, admin kini `formatWibStamp`) | Tampilkan WIB (§6.4) |
| Arti kata "log" | Deskripsi situs (`src/app/layout.tsx`): "log dan biaya per request"; Settings: "log aktivitas" | Menu tidak dinamai "Log" agar tidak tertukar dengan log request API (§3 S1) |
| Audit | `auth_events.type` adalah `text` tanpa CHECK | Jenis event baru tidak butuh migrasi |

---

## 3. Keputusan desain

| # | Keputusan | Alasan |
|---|---|---|
| S1 | Halaman sendiri: label menu dan judul **"Active Sessions"**, route **`/sessions`**, grup **Akun**, setelah Account Settings | Permintaan owner. Bahasa Inggris seperti semua label menu dan judul halaman lain (grup dan teks isi tetap bahasa Indonesia). Bukan "Log" (di produk ini berarti log request API, §2) dan bukan "Sessions" saja (bisa dikira sesi chat Playground) |
| S2 | **v4 (keputusan owner):** tampilkan negara + IP disamarkan. Yang disimpan hanya IP samar (`103.47.xx.xx`, IPv6 dua blok pertama), tidak pernah IP lengkap; negara dari header Cloudflare `cf-ipcountry`, hanya dipercaya bila `AUTH_TRUSTED_IP_HEADER=cf-connecting-ip` | Owner ingin isi halaman lebih lengkap. Data diminimalkan: IP samar tidak menunjuk satu pelanggan. Catatan: UU PDP No. 27/2022 berlaku tanpa membedakan ukuran usaha (disampaikan ke owner 2026-11-09); keputusan tetap owner |
| S3 | Tanpa percobaan login gagal | Event gagal (`otp_failed`, `otp_expired`) tidak punya `user_id`; menghubungkannya ke akun lewat email membuka siapa saja yang mencoba email itu |
| S4 | Mutasi lewat Route Handler, bukan Server Action | Konsisten dengan `src/app/api/auth/*`; cek `Origin` kita menolak request tanpa `Origin`, sedangkan Server Actions meloloskannya dengan peringatan (docs Next 16.4.5 `serverActions.md`) |
| S5 | Label perangkat dibuat di server dari `user_agent`; string mentah tidak dikirim ke browser | DTO sempit (docs Next `data-security.md`) |
| S6 | Pengenal perangkat di klien adalah `sessions.id` (uuid), bukan token | Token tidak pernah keluar dari cookie; `id` tidak bisa dipakai untuk login |
| S7 | Sesi yang sedang dipakai tidak bisa dicabut dari tabel | Keluar dari perangkat ini sudah ada di sidebar; mencegah mengeluarkan diri sendiri tanpa sengaja |
| S8 | Ikon menu: Hugeicons `LaptopPhoneSyncIcon` | Proyek memakai Hugeicons untuk UI baru; ikon ini ada di `@hugeicons/core-free-icons` (dicek). Ikon item menu saat ini belum digambar di UI (komentar `nav-items.ts`), tapi tetap wajib diisi |

---

## 4. Isi halaman

Pola dashboard-design §6 "Lists and data": tabel, bukan kumpulan card.

### 4.1 Header halaman (`PageHeader`)

- h1: "Active Sessions"
- Deskripsi: "Perangkat yang sedang masuk ke akun Anda. Keluarkan perangkat yang tidak Anda kenali."
- Aksi kanan: tombol **"Keluar dari semua perangkat lain"** (`secondaryAction`), hanya muncul jika ada sesi lain.

### 4.2 Tabel (di dalam `Card`)

| Kolom | Isi | Sumber |
|---|---|---|
| Perangkat | Baris 1: label perangkat, mis. "Chrome di Windows". Baris 2 (kecil): "Masuk {tanggal}" | `user_agent` → label (§6.3); `created_at` |
| Lokasi | Bendera negara (SVG 3:2, nama negara hanya untuk screen reader dan tooltip) + IP samar dalam huruf mono, satu baris. Tanpa data → "Tidak diketahui"; Tor (tanpa bendera) → teks "Jaringan Tor" | `country` → bendera (`country-flag-icons`) + `Intl.DisplayNames("id")`; `ip_masked` (§6.6) |
| Terakhir aktif | Sesi ini: badge "Perangkat ini". Lainnya: waktu lokal, mis. "9 Nov, 15.00" | `last_seen_at` |
| Aksi | Sesi lain: tombol "Keluar". Sesi ini: kosong | — |

- Urutan: sesi ini paling atas, lalu `last_seen_at` terbaru.
- **10 sesi per halaman dengan pagination** (keputusan owner). Halaman lewat `?page=N` (server-side); nilai tidak valid atau di luar rentang dibulatkan ke halaman terdekat yang ada. Di bawah tabel: "Halaman X dari Y" dengan tombol "Sebelumnya" / "Berikutnya" (nonaktif di ujung), hanya tampil bila lebih dari 1 halaman. Tombol header tetap mencakup semua sesi lain, bukan hanya halaman ini.
- Hanya sesi ini: tabel 1 baris + teks "Tidak ada perangkat lain yang sedang masuk." Tombol header tidak tampil.
- Di bawah tabel, satu kalimat penjelasan: "Waktu terakhir aktif diperbarui paling sering sekali per jam." (jujur soal presisi §2).

### 4.3 Status dan umpan balik

| Keadaan | Perilaku |
|---|---|
| Memuat | Skeleton baris di dalam card (dashboard-design §8: skeleton, bukan spinner) |
| Mencabut satu sesi | Tombol baris `aria-busy`, nonaktif; sukses → baris hilang, status "Perangkat dikeluarkan." (`role="status"`) |
| Mencabut semua lainnya | Tombol header `aria-busy`; sukses → tabel tinggal 1 baris, status "N perangkat dikeluarkan." |
| Gagal (jaringan / server) | Pesan di bawah tabel: "Belum bisa mengeluarkan perangkat. Coba lagi." Data di UI tidak diubah |
| Sesi target sudah tidak ada | Dianggap sukses, baris hilang (idempoten) |
| Sesi pengguna sendiri tidak valid saat aksi | Server `401`; klien mengarahkan ke `/login?next=/sessions` |

Konfirmasi: **tanpa dialog**. Mengeluarkan perangkat bisa dipulihkan (login ulang dengan kode), jadi tidak perlu interupsi (usulan, §11).

### 4.4 Desain

Mengikuti `.claude/rules/dashboard-design.md`: header halaman standar, tabel di dalam card, baris 48px, tombol baris `secondaryAction` ukuran `sm`, badge `neutral`, waktu dengan angka tabular, accent hanya untuk aksi utama dan seleksi. Tanpa `min-w-2xl` agar muat di 375px tanpa geser samping.

Mobile (keputusan owner 2026-11-09): **tabel tidak ditumpuk**. Semua kolom tetap ada di setiap ukuran layar; di bawah lebar minimum (`min-w-2xl`) tabel digeser ke kanan-kiri di dalam card, sama dengan perilaku `Table` di halaman lain. Teks di sel tidak dipatahkan (`whitespace-nowrap`).

Baris judul tabel diberi latar abu-abu `app-inset` (light: abu-abu sangat muda, dark: sedikit lebih gelap dari card; teks `app-text-3` di atasnya ≥ 4.83:1 menurut `dashboard-design.md`). Tidak memakai `app-hover`, karena itu warna baris yang disorot. Chip "Perangkat ini" memakai `Badge` bawaan.

---

## 5. Kontrak API

Semua endpoint: `POST`, `Content-Type: application/json`, body ≤ 1 KB, `Origin` = `APP_URL` (pakai `readGuardedJson` yang sudah ada), `Cache-Control: no-store`, format error sama dengan PRD backend-auth-user §8.

Autentikasi: setiap handler memanggil `readSession()` (selalu cek database). Tidak ada sesi valid → `401 { ok: false, error: { code: "unauthorized" } }`. `unauthorized` adalah kode baru di `AuthErrorCode` (`src/lib/auth/auth-contract.ts`).

### 5.1 `POST /api/auth/sessions/revoke`

| | |
|---|---|
| Body | `{ "sessionId": string }` (uuid) |
| 200 | `{ "ok": true }`, juga jika sesi sudah tidak ada atau milik orang lain (tidak membocorkan keberadaan sesi lain) |
| 400 | `invalid_input`: bukan uuid, atau `sessionId` = sesi yang sedang dipakai (S7) |
| 401 | `unauthorized` |
| 403 | Origin / Content-Type salah |

Server: `DELETE FROM sessions WHERE id = $sessionId AND user_id = $currentUserId AND id <> $currentSessionId`.

### 5.2 `POST /api/auth/sessions/revoke-others`

| | |
|---|---|
| Body | `{}` |
| 200 | `{ "ok": true, "revoked": number }` |
| 401 / 403 | sama dengan §5.1 |

Server: `DELETE FROM sessions WHERE user_id = $currentUserId AND id <> $currentSessionId`.

### 5.3 Membaca daftar

Tidak lewat API. `src/app/(dashboard)/sessions/page.tsx` (Server Component) membaca daftar di balik `<Suspense>` (wajib dengan `cacheComponents`, docs `authentication-with-cache-components.md`) dan meneruskan DTO ke komponen klien:

```ts
type ActiveSession = {
  id: string;          // sessions.id
  device: string;      // "Chrome di Windows"
  signedInAt: string;  // ISO UTC
  lastSeenAt: string;  // ISO UTC
  current: boolean;
};
```

Halaman dilindungi Proxy + `getCurrentUser()` di layout dashboard. Karena layout tidak dirender ulang saat navigasi (docs `authentication.md`), pembaca daftar **wajib** memeriksa sesi sendiri, bukan mengandalkan layout.

---

## 6. Aturan server

### 6.1 Daftar sesi

`listActiveSessions()` di `src/lib/server/auth/session.ts`:
- Sesi sekarang lewat `readSession()`; tidak ada → redirect `/login?next=/sessions`.
- Query sesi milik `user_id` itu dengan `expires_at > now()` dan `last_seen_at > now() - 7 hari` (aturan sama dengan `readSession`).
- Urut: sesi sekarang dulu, lalu `last_seen_at DESC`; 10 per halaman (`LIMIT 10 OFFSET (page-1)*10`) + hitung total untuk jumlah halaman.
- Query (2026-11-09): hitung total dan ambil halaman jalan paralel (`Promise.all`); hanya halaman di luar rentang yang butuh query kedua. `readSession()` dibungkus React `cache()` sehingga layout dan halaman berbagi satu pengecekan sesi per request (diukur: per refresh 4→3 scan `sessions`, 2→1 scan `users`). Tidak ada cache lintas request: setiap refresh tetap membaca database, karena ini data keamanan.
- Kembalikan `ActiveSession[]` (S5, S6).

### 6.2 Mencabut

`revokeSession(userId, currentSessionId, targetId)` dan `revokeOtherSessions(userId, currentSessionId)` di file yang sama. Selalu menyaring `user_id`; tidak pernah percaya `sessionId` dari klien saja.

### 6.3 Label perangkat

Fungsi murni `deviceLabel(userAgent: string | null): string` (file sendiri + unit test, tanpa dependensi baru):
- Browser: Edge, Opera, Firefox, Samsung Internet, Chrome, Safari (urutan cek penting: Edge dan Opera juga memuat "Chrome").
- Sistem: Windows, macOS, iOS, iPadOS, Android, Linux, ChromeOS.
- Hasil "{browser} di {sistem}"; tidak dikenal atau `null` → "Perangkat tidak dikenal".
- Tanpa versi browser (label stabil).

Batas yang diterima: `user_agent` bisa dipalsukan pengirim; label hanya petunjuk, bukan bukti identitas perangkat.

### 6.4 Waktu

Database menyimpan instan waktu (aturan proyek). **Website selalu menampilkan WIB** (owner 2026-11-13) lewat `formatWib` di `src/lib/date-format.ts`; teksnya sama di server dan klien, jadi tidak perlu render setelah mount.

### 6.5 Audit

Tambah jenis `auth_events.type`: `session_revoked`, `sessions_revoked_others`, dengan `user_id`, `email_hash`, `ip_hash` seperti event lain. Tanpa migrasi (§2).

### 6.6 IP disamarkan dan negara (v4)

- Diambil saat login (`createSession`) lewat `clientInfo(request)` di `request-guard.ts`; IP dari header tepercaya yang sama dengan rate limit.
- `maskIp()` (`client-info.ts`): IPv4 → dua oktet pertama + `.xx.xx`; IPv4 dalam IPv6 (`::ffff:`) diperlakukan sebagai IPv4; IPv6 → dua blok pertama + `:…`; bukan IP → `null`. Hanya hasil ini yang disimpan.
- `normalizeCountry()`: kode dua huruf atau `T1` (Tor); `XX` dan selain itu → `null`. Header `cf-ipcountry` hanya dibaca bila header IP tepercaya adalah `cf-connecting-ip` (di belakang Cloudflare); di luar itu pengunjung bisa mengirimnya sendiri.
- `countryName()`: `Intl.DisplayNames(["id"], { type: "region" })` → "Indonesia"; `T1` → "Jaringan Tor". Dipakai sebagai `aria-label` dan tooltip bendera, tidak sebagai teks yang terlihat (v5).
- `countryFlagSvg()`: SVG 3:2 dari paket `country-flag-icons` 1.6.20 (MIT, versi dikunci), dibuat di server lalu dikirim hanya untuk baris yang tampil. Bukan emoji, karena Windows menampilkan emoji bendera sebagai dua huruf. Markup statis dari paket (tanpa skrip, dicek di unit test), jadi aman di-inline.
- Sesi yang dibuat sebelum v4 tidak punya data ini dan tampil "Tidak diketahui".
- Batas yang diterima: bila server bisa diakses langsung (bukan lewat Cloudflare), kedua header bisa dipalsukan; di produksi server hanya boleh dijangkau lewat Cloudflare.
- Migrasi: `drizzle/0002_*.sql` (dua `ADD COLUMN` nullable, tanpa menghapus data).

---

## 7. Keamanan

| Ancaman | Kontrol |
|---|---|
| Mencabut sesi orang lain (IDOR) | Semua query menyaring `user_id` dari sesi server; 200 generik untuk id asing |
| CSRF | `Origin` wajib = `APP_URL`, `Content-Type: application/json`, cookie `SameSite=Lax`, hanya `POST` |
| Kebocoran token | Token tidak pernah dikirim ke klien; hanya `sessions.id` |
| Data berlebih ke klien | DTO sempit (§5.3); `user_agent` mentah, `token_hash`, `user_id` tidak dikirim |
| Sesi basi tetap tampil | Filter kedaluwarsa + idle sama dengan `readSession` |
| Cache | Dibaca tanpa cache (`readSession` selalu cek DB); respons API `no-store` |
| Halaman tanpa login | Proxy (matcher `/sessions`) + `getCurrentUser()` + cek sesi di pembaca daftar |
| Path statis bertabrakan dengan matcher | Cek `public/` tidak punya folder `sessions` (pelajaran dari bug `/models` di logo landing) |

---

## 8. Lokasi file (sesuai `architecture.md`, "Feature areas")

```
src/
  proxy.ts                                         + "/sessions/:path*" di matcher
  app/
    (dashboard)/sessions/page.tsx                  baru: metadata, <Suspense> pembaca sesi, render view
    api/auth/sessions/revoke/route.ts              POST
    api/auth/sessions/revoke-others/route.ts       POST
  components/dashboard/
    shell/nav-items.ts (+ .test.ts)                + item "Active Sessions" di grup Akun
    sessions/sessions-view.tsx                     PageHeader + card (struktur halaman)
    sessions/sessions-table.tsx                    tabel + aksi (client)
    sessions/sessions-copy.ts                      teks halaman
  lib/
    auth/auth-contract.ts (+ .test.ts)             + "/sessions" di DASHBOARD_PATHS, parseRevokeBody, kode `unauthorized`
    auth/auth-client.ts                            + revokeSession, revokeOtherSessions
    server/auth/session.ts                         + listActiveSessions, revokeSession, revokeOtherSessions
    server/auth/device-label.ts (+ .test.ts)       deviceLabel()
```

Halaman Settings **tidak diubah**. `src/lib/server/auth/` akan berisi 10 file termasuk test (batas ~10 per folder). Setelah struktur berubah: `npm run map`.

---

## 9. Pengujian

### 9.1 Unit (`node:test`)
- `deviceLabel`: Chrome/Windows, Safari/macOS, Safari/iOS, Edge (bukan Chrome), Opera, Firefox/Linux, Samsung Internet/Android, kosong, string acak.
- `parseRevokeBody`: uuid valid, bukan uuid, tipe salah, body kosong.
- `nav-items`: `activeItem("/sessions")?.label === "Active Sessions"`, `groupIndexOf("/sessions") === 2`.
- `safeNextPath("/sessions") === "/sessions"`.

### 9.2 Integrasi (DB lokal, dev server)
- Tanpa cookie → `/sessions` dialihkan ke `/login?next=%2Fsessions`.
- Dua login di dua "perangkat" (cookie berbeda) → daftar berisi 2, satu `current`.
- Cabut sesi lain → baris hilang dari DB; cookie lama ke dashboard → redirect `/login`.
- Cabut `sessionId` milik user lain → 200, sesi user lain tetap ada.
- Cabut sesi sendiri lewat API → 400, sesi tetap.
- Revoke-others dengan 3 sesi → `revoked: 2`, sesi sekarang tetap.
- Tanpa cookie / cookie tidak valid → 401. Origin salah → 403.
- Sesi kedaluwarsa / idle > 7 hari tidak muncul.
- Event audit tercatat dengan `user_id`.

### 9.3 Kriteria penerimaan
- [ ] Menu "Active Sessions" muncul di grup Akun; breadcrumb header menampilkannya.
- [ ] Halaman menampilkan data asli; sesi sekarang bertanda "Perangkat ini".
- [ ] Tidak ada token, `user_agent` mentah, atau IP di HTML/payload klien.
- [ ] Semua status §4.3 muncul.
- [ ] Muat di 375px tanpa geser samping.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build`, semua test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing di `dashboard-design.md` §2 bersih; detector impeccable bersih pada file yang berubah.

---

## 10. Hubungan dengan pekerjaan lain

- **Nama & email asli di dashboard** (PRD backend-auth-user §13) belum disambungkan. Tidak menghalangi PRD ini.
- **Job pembersihan sesi kedaluwarsa** (PRD backend-auth-user §9.6) belum ada. Daftar tetap benar karena menyaring kedaluwarsa, tapi tabel `sessions` terus bertambah sampai job itu dibuat.

---

## 11. Keputusan yang dibutuhkan dari owner

Diputuskan 2026-11-09:

1. Nama menu dan route: `/sessions`. Label awalnya "Sesi login", diganti **"Active Sessions"** atas koreksi owner (2026-11-09): label menu dan judul halaman lain berbahasa Inggris.
2. Teks halaman §4: usulan diterima.
3. **10 sesi per halaman dengan pagination** (owner; menggantikan usulan 20 tanpa pagination).
4. Tanpa dialog konfirmasi: usulan diterima.
5. Email pemberitahuan: **tidak sekarang**, ditunda ke fase berikutnya (owner).
6. **v4:** tampilkan negara (Cloudflare) dan IP disamarkan (owner, 2026-11-09).
7. **v5:** negara ditampilkan sebagai bendera, bukan teks (owner, 2026-11-09).

---

## 12. Di luar cakupan (fase berikutnya)

Log login lengkap per waktu, IP dan lokasi, notifikasi email login dari perangkat baru, menampilkan percobaan login gagal, mengganti nama perangkat, sesi admin (PRD backend-auth-admin), pencabutan otomatis saat akun ditangguhkan dari UI admin (fungsinya sudah ada: `deleteUserSessions`).

---

## 13. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/lib/server/db/schema/auth.ts` | kolom `sessions`, `auth_events` | Dibaca |
| `src/lib/server/auth/session.ts` | aturan validitas, `TOUCH_EVERY_MS`, `deleteUserSessions` | Dibaca |
| `src/lib/server/auth/request-guard.ts` | `readGuardedJson`, cek Origin | Dibaca |
| `src/components/dashboard/shell/nav-items.ts` (+ test), `header-breadcrumb.tsx` | grup menu, `activeItem`, breadcrumb | Dibaca |
| `src/proxy.ts`, `src/lib/auth/auth-contract.ts` | matcher literal, `DASHBOARD_PATHS`, `AuthErrorCode` | Dibaca |
| `src/app/(dashboard)/usage/page.tsx`, `settings-view.tsx`, `settings-copy.ts` | pola route → view; kata "log aktivitas" | Dibaca |
| `src/app/layout.tsx` | deskripsi situs "log dan biaya per request" | Dibaca |
| `src/components/app-kit/*` | `PageHeader`, `Card`, `Table`, `Badge`, `EmptyState`, `button.ts` | Dibaca |
| `@hugeicons/core-free-icons` | `LaptopPhoneSyncIcon` tersedia | Dicek |
| `src/lib/date-format.ts` | hanya `formatUtc` | Dibaca |
| `.claude/rules/architecture.md`, `backend-security.md`, `dashboard-design.md` | lokasi file, batas, gaya | Dibaca |
| Docs Next 16.4.5: `serverActions.md`, `authentication.md` (baris 1358), `authentication-with-cache-components.md` | S4, §5.3 | Dibaca |
| Akurasi `deviceLabel` untuk semua browser nyata | — | **Belum dibuktikan** (diuji dengan contoh UA di §9.1) |
