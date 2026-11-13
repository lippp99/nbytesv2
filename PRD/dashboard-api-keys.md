# PRD: Halaman API Keys (dashboard pengguna) tersambung ke backend

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima. **Dibangun** 2026-11-12; uji integrasi §11.2 lolos di DB lokal lewat curl (belum dicek di browser; kontras bar belum diukur) |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/api-keys`: daftar key aktif milik pengguna dari database, buat key asli, cabut key asli, pemakaian bulan ini per key, penyetelan desain |
| Di luar cakupan | Ubah nama/batas key (belum ada endpoint, §10 K3), riwayat key dicabut, pemakaian per hari per key, halaman Usage, Quick Start, Playground, landing page |
| Bergantung pada | `PRD/gateway-api.md` §5 dan §11 (sudah dibangun: tabel `api_keys`, `POST /api/keys`, `DELETE /api/keys/{id}`), `PRD/gateway-pricing-billing.md` §9 (batas bulanan dicek saat request) |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Halaman API Keys sudah punya tampilan lengkap, tetapi semua isinya data contoh. Backend untuk membuat dan mencabut key sudah ada dan sudah dipakai gateway. Yang belum ada: fungsi untuk menampilkan daftar key pengguna, client untuk memanggil endpoint, dan sambungan antara halaman dan keduanya.

Tujuan: pengguna melihat key aslinya, membuat key yang benar-benar bisa dipakai memanggil `/api/v1`, mencabut key, dan melihat pemakaian bulan ini terhadap batas yang ia pasang.

---

## 2. Kondisi saat ini (bukti dari kode)

| Hal | Isi kode sekarang | Dampak |
|---|---|---|
| Route | `src/app/(dashboard)/api-keys/page.tsx` hanya merender `<ApiKeysView />`, tanpa membaca data | Perlu pembaca data di balik `<Suspense>` (pola `billing/page.tsx`) |
| Daftar key | `api-keys-view.tsx` memakai `apiKeys` dari `shared/dashboard-data.ts` (3 key contoh) | Diganti data asli |
| Buat key | `create-key-form.tsx` membuat string acak di browser (`demoSecret`, awalan `nb-live-`) | Diganti panggilan `POST /api/keys` |
| Cabut key | `keys-table.tsx` hanya membuang baris dari state | Diganti panggilan `DELETE /api/keys/{id}` |
| Teks | `api-keys-copy.ts`: "Mode demo: key ini tidak berlaku." | Kalimat demo dihapus |
| Format key asli | `api-key-contract.ts`: awalan `nbk_`, tampilan 8 karakter (`nbk_` + 4), maks 20 key aktif (A4), nama maks 40, batas maks $1.000.000 | Tampilan di UI ikut format ini, bukan `nb-live-…4f2a` |
| Endpoint buat | `POST /api/keys`: `readGuardedJson` (Origin, JSON, ≤ 1 KB) → `readSession` → `parseCreateKeyBody` → `createApiKey`. Balas `201 { ok, key: CreatedKey }` | Sudah siap dipakai |
| Endpoint cabut | `DELETE /api/keys/{id}`: cek Origin, sesi, id harus uuid, lalu `revokeApiKey`. Key orang lain atau tidak ada → `404 not_found` | Sudah siap dipakai |
| Kode error | `key_limit_reached` (409), `invalid_input` (400), `unauthorized` (401), `not_found` (404), `unavailable` (403 Origin salah / 503) lewat `authErrorResponse` | Client memetakan semuanya (§6) |
| Daftar key di server | `src/lib/server/gateway/api-keys.ts` hanya punya `createApiKey`, `revokeApiKey`, `authenticateApiKey` | **Fungsi daftar belum ada** |
| Pemakaian bulan ini | `request-billing.ts`: `keySpentThisMonth` = jumlah `coalesce(charge_micros, hold_micros)` dari `gateway_requests` sejak tanggal 1 pukul 00.00 **WIB** (owner 2026-11-13; sebelumnya UTC); fungsi ini privat | Angka di halaman harus memakai rumus yang sama dengan yang dipakai saat menolak request |
| Batas bulanan | `holdForRequest` menolak dengan `402 key_budget_exceeded` bila pemakaian + tahanan > batas | Teks "Request ditolak setelah batas tercapai" benar |
| `last_used_at` | Ditulis paling sering sekali per menit per key | Presisi "Terakhir dipakai" per menit |
| Proteksi halaman | `/api-keys/:path*` sudah ada di matcher `src/proxy.ts` dan `DASHBOARD_PATHS` | Tidak perlu diubah |
| Angka di sidebar | `sidebar-nav.tsx`: jumlah key = `apiKeys.length` dari data contoh | Lihat §8 |
| Folder `src/lib/gateway/` | Sudah 10 file termasuk test (batas ~10 per folder, `architecture.md` §4) | Client baru tidak boleh langsung ditambahkan di sana (§9) |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Keterangan |
|---|---|---|
| F1 | Daftar key aktif | Nama, tampilan key (`nbk_ab12…`), tanggal dibuat, terakhir dipakai, pemakaian bulan ini vs batas. Key yang dicabut tidak tampil |
| F2 | Buat key | Nama (wajib, maks 40) + batas bulanan USD (opsional). Key penuh tampil **sekali**, dengan tombol salin |
| F3 | Cabut key | Konfirmasi di baris yang sama (sudah ada di UI). Tidak bisa dibatalkan setelah dikonfirmasi |
| F4 | Batas 20 key aktif | Tampil "N dari 20 key". Pada 20 key, tombol "Buat key" nonaktif dengan alasan tertulis |
| F5 | Status batas | Pemakaian ≥ 85% batas: kata "Hampir habis". Pemakaian ≥ batas: "Batas tercapai, request ditolak". Warna selalu disertai kata (dashboard-design §3) |
| F6 | Waktu reset batas | Satu kalimat di bawah tabel: "Pemakaian dihitung sejak tanggal 1 pukul 00.00 WIB." Sesuai `wibMonthStart` |
| F7 | Error yang jelas | Pesan per kasus (§6). Gagal tidak mengubah data di layar |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Contoh pemakaian di kartu "key baru": `export NBYTES_API_KEY=nbk_…` dan base URL | Pengguna langsung tahu cara pakai. `CodeBlock` sudah punya tombol salin | Kecil. Base URL produksi **belum diputuskan** (gateway-api A1), jadi base URL baru bisa tampil setelah domain ada |
| R2 | Ubah nama dan batas bulanan key | Mengganti batas tanpa membuat key baru dan memperbarui server pengguna | Endpoint baru `PATCH /api/keys/{id}` + fungsi server. Belum ada di PRD gateway |
| R3 | Peringatan sebelum menutup kartu "key baru" bila key belum disalin | Key tidak bisa dilihat lagi | Kecil, hanya di klien |

---

## 4. Isi halaman

Pola dashboard-design §6 "Lists and data": tabel di dalam card.

### 4.1 Header (`PageHeader`)

- h1 "API Keys", deskripsi yang ada sekarang (tetap).
- Aksi kanan: "Buat key" (`primaryAction`). Nonaktif saat form terbuka atau saat 20 key aktif.

### 4.2 Tabel "Key aktif"

| Kolom | Isi | Sumber |
|---|---|---|
| Nama | Nama key | `api_keys.name` |
| Key | `nbk_ab12…` dalam huruf mono | `api_keys.key_prefix` + "…" |
| Dibuat | Tanggal | `created_at` |
| Terakhir dipakai | Tanggal dan jam, atau "Belum pernah" | `last_used_at` |
| Pemakaian bulan ini | `$12.40 / $50.00` + bar + kata status (F5), atau `$12.40 · Tanpa batas` | rumus `keySpentThisMonth` + `monthly_budget_micros` |
| Aksi | Tombol cabut dengan konfirmasi di sel yang sama | — |

- Urutan: terbaru dibuat di atas (**usulan**).
- Deskripsi card: "N dari 20 key" (F4).
- Tanpa pagination: maksimal 20 baris (A4).
- Kosong: `EmptyState` yang ada sekarang ("Belum ada key aktif").

### 4.3 Status dan umpan balik

| Keadaan | Perilaku |
|---|---|
| Memuat halaman | Skeleton tabel di dalam card (pola `BillingSkeleton`, dashboard-design §8) |
| Membuat key | Tombol submit `aria-busy` dan nonaktif. Sukses: form tertutup, kartu key baru tampil, daftar diperbarui dari server (`router.refresh()`) |
| Mencabut key | Tombol konfirmasi `aria-busy`. Sukses: baris hilang, status "Key dicabut." (`role="status"`) |
| Mencabut key yang sudah dicabut di tab lain | Server `404`: baris dibuang juga, karena hasil akhirnya sama |
| 20 key aktif | Server `409 key_limit_reached`: pesan "Sudah 20 key aktif. Cabut satu key dulu." di bawah form |
| Sesi habis | `401`: arahkan ke `/login?next=%2Fapi-keys` |
| Jaringan / server gagal | "Belum bisa menyimpan. Coba lagi." Data di layar tidak berubah |

Key penuh hanya disimpan di state komponen kartu "key baru" dan hilang saat kartu ditutup atau halaman ditinggal. Key penuh tidak pernah ditulis ke URL, `localStorage`, atau log.

---

## 5. Data dan server

### 5.1 Fungsi daftar (baru)

`listUserApiKeys(userId)` di `src/lib/server/gateway/api-keys.ts`:
- Key milik `userId` dengan `revoked_at IS NULL`, terbaru dulu.
- Pemakaian bulan ini per key dalam **satu query** (`LEFT JOIN` + `GROUP BY` ke `gateway_requests`, memakai indeks `gateway_requests_api_key_created_idx` yang sudah ada), bukan satu query per key.
- Rumus pemakaian dipindah ke satu tempat dan dipakai bersama `keySpentThisMonth`, supaya angka di halaman tidak bisa berbeda dari angka yang dipakai untuk menolak request (aturan "No third copy" dan keselarasan data).
- DTO sempit ke klien:

```ts
type UserApiKey = {
  id: string;                         // uuid, dipakai untuk mencabut
  name: string;
  keyPrefix: string;                  // "nbk_ab12"
  createdAt: string;                  // ISO UTC
  lastUsedAt: string | null;          // ISO UTC
  monthlyBudgetMicros: number | null;
  spentThisMonthMicros: number;
};
```

`key_hash` dan `user_id` tidak pernah dikirim ke klien.

### 5.2 Halaman

`src/app/(dashboard)/api-keys/page.tsx` (Server Component): `getCurrentUser()` lalu `listUserApiKeys(user.id)` di balik `<Suspense>`, lalu kirim DTO ke `ApiKeysView`. Pola sama dengan `billing/page.tsx` (layout tidak dirender ulang saat navigasi, jadi halaman memeriksa sesi sendiri).

### 5.3 Endpoint

Tidak ada endpoint baru untuk v1. `POST /api/keys` dan `DELETE /api/keys/{id}` dipakai apa adanya.

---

## 6. Client

`api-key-client.ts` (lokasi di §9), mengikuti pola `src/lib/payments/deposit-client.ts`:

| Fungsi | Hasil |
|---|---|
| `createApiKey(body)` | `{ ok: true, key: CreatedKey }` atau `{ ok: false, error }` dengan `kind`: `key_limit_reached`, `invalid_input`, `unauthorized`, `offline`, `unavailable` |
| `revokeApiKey(id)` | `{ ok: true }` atau `{ ok: false, error }` dengan `kind`: `not_found`, `unauthorized`, `offline`, `unavailable` |

Validasi form memakai `parseCreateKeyBody` / `KEY_NAME_MAX` dari kontrak yang sama dengan server, bukan aturan kedua. Batas bulanan dari input dolar tetap lewat `parseDollarsToMicros` (sudah dipakai).

Catatan: `parseDollarsToMicros` menerima sampai 7 digit dolar ($9.999.999,99), sedangkan server membatasi $1.000.000. Input di atas itu akan ditolak server sebagai `invalid_input`. **Usulan:** form memeriksa `MAX_BUDGET_MICROS` juga, dengan pesan "Maksimal $1.000.000."

---

## 7. Penyetelan desain (usulan Claude)

Semua mengikuti `.claude/rules/dashboard-design.md`. Komponen dari `app-kit`, tanpa komponen baru.

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | Bar pemakaian berisi warna accent (`bg-app-accent`), merah di ≥ 85% tanpa kata | Bar netral (`bg-app-text-3`) saat normal; `app-warning` + kata "Hampir habis" di ≥ 85%; `app-danger` + kata "Batas tercapai" di ≥ 100% | Aturan §3: accent hanya untuk aksi utama, seleksi, tautan; status warna selalu dengan kata |
| D2 | Kartu key baru berbingkai `border-app-accent/50` | Bingkai `app-border` biasa, ikon peringatan `app-warning` | Kartu ini peringatan, bukan seleksi; accent tidak untuk dekorasi |
| D3 | Tanggal dalam UTC tanpa jam | "Dibuat": tanggal saja. "Terakhir dipakai": tanggal + jam WIB (`formatWib`, owner 2026-11-13) | Sama dengan pendekatan Active Sessions §6.4; menghindari hydration mismatch |
| D4 | Tampilan key `nb-live-…4f2a` | `nbk_ab12…` | Format asli dari kontrak (§2) |
| D5 | Deskripsi card "3 key" | "3 dari 20 key", dan pada 20 tombol nonaktif dengan teks alasan di bawah header | Pengguna tahu batasnya sebelum ditolak server |
| D6 | Tidak ada penjelasan waktu reset | Satu kalimat kecil `text-app-small text-app-text-3` di bawah tabel (F6) | Tanpa ini pengguna tidak tahu kapan batas bulanan kembali nol |
| D7 | Angka uang di kolom pemakaian sudah mono + tabular | Tetap. Kolom "Dibuat" dan "Terakhir dipakai" juga `tabular-nums` | Angka sejajar antar baris |
| D8 | Tabel `min-w-3xl` digeser samping di HP | Tetap | Konsisten dengan keputusan owner untuk tabel Active Sessions (2026-11-09) |

Kontras warna untuk bar (grafik non-teks, butuh ≥ 3:1) **belum diukur**; diukur saat implementasi (dashboard-design §9).

---

## 8. Dampak ke bagian lain

| Bagian | Dampak | Usulan |
|---|---|---|
| Angka key di sidebar (`sidebar-nav.tsx`) | Masih `apiKeys.length` dari data contoh | Ikut diganti dengan jumlah key asli (dibaca di server, dikirim ke sidebar), **atau** angka key dihapus dari sidebar. Keputusan §10 K4 |
| Quick Start (`connection-card.tsx`, `quick-start-view.tsx`) | Memakai `apiKeys` contoh | Tidak diubah di PRD ini. `ApiKey` dan `apiKeys` di `dashboard-data.ts` tetap ada sampai Quick Start disambungkan |
| Landing page | Tidak memakai data key | Tidak tersentuh |

---

## 9. Lokasi file (sesuai `architecture.md`)

```
src/
  app/(dashboard)/api-keys/page.tsx                 + Suspense, getCurrentUser, listUserApiKeys
  components/dashboard/api-keys/
    api-keys-view.tsx                               terima keys dari server; tanpa dashboard-data
    create-key-form.tsx                             panggil client; hapus demoSecret
    keys-table.tsx                                  tipe UserApiKey, panggil client, desain §7
    api-keys-copy.ts                                hapus kalimat demo; teks error dan status baru
    api-keys-skeleton.tsx                           baru: skeleton tabel
  lib/
    gateway/keys/                                   usulan folder baru (3 file):
      api-key-contract.ts (+ .test.ts)              dipindah dari lib/gateway/, + tipe UserApiKey
      api-key-client.ts                             baru (§6)
    server/gateway/api-keys.ts                      + listUserApiKeys; rumus pemakaian bersama
    server/gateway/request-billing.ts               pakai rumus pemakaian bersama
```

Alasan folder `lib/gateway/keys/`: `lib/gateway/` sudah 10 file. Memindahkan kontrak berarti import di `api-keys.ts`, `public-api.ts`, `errors.ts`, dan route `api/keys` ikut diubah. Alternatif tanpa memindah file: taruh client di `src/lib/api-key-client.ts`. Keputusan §10 K5. Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| K1 | Urutan daftar: terbaru dibuat di atas? | Ya |
| K2 | Tampilkan contoh `export NBYTES_API_KEY=…` di kartu key baru (R1)? | Ya, tanpa base URL sampai domain diputuskan |
| K3 | Ubah nama/batas key (R2) masuk v1? | Tidak, fase berikutnya |
| K4 | Angka jumlah key di sidebar: disambungkan atau dihapus? | Disambungkan bersama angka model (lihat PRD `dashboard-models.md` §10) |
| K5 | Lokasi client: folder `lib/gateway/keys/` atau `lib/api-key-client.ts`? | `lib/gateway/keys/` |
| K6 | Penyetelan desain D1–D8? | Diterima semua |
| K7 | Peringatan sebelum menutup kartu key baru (R3)? | Ya |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit (`node:test`)
- Rumus pemakaian bersama: hanya bulan berjalan WIB, `charge` dipakai bila ada, `hold` bila belum selesai.
- Status batas: < 85%, ≥ 85%, ≥ 100%, tanpa batas.
- Validasi form: nama kosong, 41 karakter, batas `0`, `1000000.01`, `abc`.

### 11.2 Integrasi (DB lokal, dev server)
- Tanpa sesi → `/api-keys` dialihkan ke `/login?next=%2Fapi-keys`.
- Buat key → baris baru di `api_keys`, key penuh tampil sekali, muat ulang halaman → hanya `nbk_xxxx…`.
- Key baru dipakai di `GET /api/v1/models` → `200`; setelah dicabut → `401`.
- Key ke-21 → pesan `key_limit_reached`.
- Cabut key milik pengguna lain lewat API → `404`, key itu tetap aktif.
- Pemakaian bulan ini di halaman = angka `keySpentThisMonth` untuk key yang sama.
- Baris uji di DB lokal dihapus setelah pengujian.

### 11.3 Kriteria penerimaan
- [ ] Tidak ada impor `dashboard-data` di `components/dashboard/api-keys/`.
- [ ] Tidak ada `key_hash`, `user_id`, atau key penuh (selain sesaat setelah dibuat) di HTML atau payload.
- [ ] Semua keadaan di §4.3 muncul.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing (dashboard-design §2) bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/app/(dashboard)/api-keys/page.tsx`, `billing/page.tsx` | route tanpa data; pola Suspense + `getCurrentUser` | Dibaca |
| `src/components/dashboard/api-keys/*` (4 file) | tampilan, `demoSecret`, bar 85%, `border-app-accent/50`, `min-w-3xl` | Dibaca |
| `src/components/dashboard/shared/dashboard-data.ts` | `ApiKey`, `apiKeys` contoh | Dibaca |
| `src/lib/gateway/api-key-contract.ts` | `nbk_`, 8 karakter, 20 key, 40 karakter, batas $1.000.000 | Dibaca |
| `src/lib/server/gateway/api-keys.ts` | fungsi yang ada, tidak ada fungsi daftar | Dibaca |
| `src/lib/server/gateway/request-billing.ts` | `keySpentThisMonth`, `monthStartUtc`, `key_budget_exceeded` | Dibaca |
| `src/app/api/keys/route.ts`, `src/app/api/keys/[id]/route.ts` | kontrak endpoint | Dibaca |
| `src/lib/server/auth/request-guard.ts`, `src/lib/server/errors.ts` | bentuk error | Dibaca |
| `src/lib/server/db/schema/gateway.ts` | kolom `api_keys`, indeks `gateway_requests` | Dibaca |
| `src/proxy.ts`, `src/lib/auth/auth-contract.ts` | `/api-keys` sudah dilindungi | Dibaca |
| `src/lib/payments/deposit-client.ts`, `src/lib/price-format.ts` | pola client, `parseDollarsToMicros` 7 digit | Dibaca |
| `src/components/dashboard/shell/sidebar/sidebar-nav.tsx` | angka key dari data contoh | Dibaca |
| `PRD/gateway-api.md` §3, §5, §11, A1–A6 | aturan key, endpoint, domain belum diputuskan | Dibaca |
| Kontras bar pemakaian | — | **Belum diukur** |
| Perilaku di browser | — | **Belum dibuktikan** (belum dibangun) |
