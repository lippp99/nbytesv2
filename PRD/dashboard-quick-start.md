# PRD: Halaman Quick Start (dashboard pengguna) tersambung ke backend

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima. **Dibangun** 2026-11-12 dengan 5 langkah (Q3), "Model termurah" (Q2) dan kartu setup yang menyusut (Q4); `dashboard-data.ts` dihapus. Uji integrasi §11.2 lolos di DB lokal lewat curl. Belum dicek di browser |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/quick-start`: sapaan dari sesi, langkah setup yang mengikuti keadaan akun asli, pembuat request dengan model dan base URL asli, kartu koneksi, daftar model, penyetelan desain |
| Di luar cakupan | Onboarding bertahap di luar halaman ini (tur, email), contoh kode bahasa lain selain cURL/Python/TypeScript, landing page |
| Bergantung pada | `PRD/dashboard-api-keys.md`, `PRD/dashboard-models.md`, `PRD/dashboard-usage.md`, `PRD/dashboard-playground.md` (semuanya sudah dibangun 2026-11-12), `PRD/gateway-api.md` A1 (path `/api/v1`) |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Quick Start adalah halaman pertama setelah login (`DEFAULT_AFTER_LOGIN = "/quick-start"` di `src/lib/auth/auth-contract.ts`). Tampilannya sudah lengkap: sapaan, empat langkah setup, pembuat request (model + bahasa), kartu Koneksi, Model populer, dan tautan Jelajahi. Semua isinya contoh: nama "Rina", jumlah key 3, 12 model, base URL `https://api.example.com/v1`, dan status langkah yang ditulis tetap di kode.

Semua data yang dibutuhkan sudah ada di backend yang dibangun hari ini: sesi (nama), `countActiveApiKeys`, `listCatalogForUsers` / `countActiveModels`, `gateway_requests` (request pertama), dan `api_keys.monthly_budget_micros` (batas). Tidak perlu endpoint baru.

Tujuan: pengguna baru tahu persis langkah berikutnya, dan contoh kode yang ia salin langsung jalan dengan base URL dan model yang benar-benar aktif.

---

## 2. Kondisi saat ini (bukti dari kode)

### 2.1 Mockup frontend

| Bagian | Isi sekarang | Sumber mock |
|---|---|---|
| Route | `quick-start/page.tsx` merender `<QuickStartView />` tanpa data | — |
| Sapaan | "Halo Rina." dari `account.userName.split(" ")[0]` | `shared/dashboard-data.ts` |
| Langkah 1 "Buat akun" | Selalu selesai, menyebut `account.email` contoh | `dashboard-data.ts` |
| Langkah 2 "Buat API key" | Selesai bila `apiKeys.length > 0` (data contoh, selalu 3) | `dashboard-data.ts` |
| Langkah 3 "Kirim request pertama" | Selalu "current", berisi pembuat request | ditulis tetap |
| Langkah 4 "Pantau biaya dan pasang batas" | Selalu "todo" | ditulis tetap |
| Pembuat request | 4 model tetap (`gpt-5`, `claude-sonnet-4.5`, `gemini-2.5-pro`, `deepseek-v3.2`) dengan logo; cURL/Python/TypeScript; harga | `model-catalog.ts` |
| Kartu Koneksi | Base URL contoh, "API key aktif" = 3, "Model tersedia" = 12 | `BASE_URL`, `apiKeys`, `mockModels` |
| Model populer | 5 model tetap + provider + harga input | `model-catalog.ts` |
| Jelajahi | Tautan Playground, API Docs, Usage | teks tetap (sudah benar) |
| Contoh kode | `shared/build-snippet.ts`: key dari `NBYTES_API_KEY`, SDK OpenAI | dipakai juga oleh Docs |

### 2.2 Data asli yang tersedia

| Kebutuhan | Sumber yang sudah ada |
|---|---|
| Nama depan | `getCurrentUser()` → `firstName`; akun lama tanpa nama: email (`displayName` di `src/lib/display-name.ts`) |
| Jumlah key aktif | `countActiveApiKeys(userId)` (`src/lib/server/gateway/api-keys.ts`, sudah dipakai sidebar) |
| Model aktif dan jumlahnya | `listCatalogForUsers()`, `countActiveModels()` (`src/lib/server/gateway/catalog.ts`) |
| Request pertama | `gateway_requests` milik pengguna (belum ada fungsi "sudah pernah request") |
| Batas bulanan terpasang | `api_keys.monthly_budget_micros` (belum ada fungsi "ada key dengan batas") |
| Base URL | `authEnv().appOrigin` + `/api/v1`, pola yang sudah dipakai Playground (`playground/page.tsx`) |

### 2.3 Temuan

| # | Temuan | Dampak |
|---|---|---|
| T1 | Status langkah ditulis tetap: pengguna baru tanpa key tetap melihat "Kirim request pertama" sebagai langkah aktif | Langkah harus dihitung dari data (F2) |
| T2 | Model di pembuat request dan "Model populer" adalah id contoh. Bila katalog asli tidak memuat id itu, `modelById` mengembalikan `undefined` dan baris hilang diam-diam | Diganti katalog asli |
| T3 | `model_prices` tidak menyimpan provider (keputusan M1 halaman Models), jadi logo dan nama provider tidak bisa diisi | Dihapus, seperti halaman Models dan Playground |
| T4 | "Model populer" butuh data popularitas. Tidak ada kolom atau keputusan tentang model unggulan. Memakai pemakaian semua pengguna berarti memperlihatkan data bisnis ke setiap pengguna | Perlu keputusan §10 Q2 |
| T5 | Penanda langkah `current` memakai `bg-app-accent` (seleksi: sesuai aturan). Bar progres juga accent untuk langkah selesai: ini bukan aksi atau seleksi | D3 |
| T6 | Katalog lokal punya 0 model aktif (dicek saat membangun halaman Models dan Usage 2026-11-12) | Pembuat request perlu keadaan "belum ada model" |
| T7 | `DEFAULT_AFTER_LOGIN = "/quick-start"`: setiap login berakhir di sini | Kesalahan data contoh di halaman ini dilihat setiap pengguna |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Isi |
|---|---|---|
| F1 | Sapaan | "Halo {nama depan}." atau email untuk akun tanpa nama |
| F2 | Langkah dihitung dari data | 1. Akun: selalu selesai (email asli). 2. Key: selesai bila ada key aktif. 3. Request pertama: selesai bila ada request **berhasil lewat API key** (bukan Playground). 4. Batas: selesai bila ada key aktif dengan batas bulanan. Langkah aktif = langkah pertama yang belum selesai |
| F3 | Semua selesai | Kartu setup menyusut menjadi satu baris "Setup selesai" + tautan ke Usage (**usulan**, §10 Q4) |
| F4 | Pembuat request | Model dari katalog aktif (§10 Q2 untuk pilihan model), cURL/Python/TypeScript, base URL asli, harga jual per 1M |
| F5 | Kartu Koneksi | Base URL asli, jumlah key aktif, jumlah model aktif |
| F6 | Katalog kosong | Pembuat request: "Belum ada model yang tersedia. Hubungi admin." tanpa kode |
| F7 | Langkah 2 tanpa key | Tombol utama header "Buat API key" tetap; langkah 2 menunjukkan tombol yang sama |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Langkah "Isi saldo" sebelum request pertama, selesai bila saldo > 0 | Tanpa saldo request pertama ditolak `402`; sekarang tidak ada langkah yang memberi tahu | Kecil: `userBalance` sudah ada (`user-billing.ts`). Mengubah jumlah langkah dari 4 menjadi 5 |
| R2 | Contoh kode dengan streaming | Banyak pengguna memakai streaming | Kecil, di `build-snippet.ts`; menambah panjang contoh |

---

## 4. Isi halaman

Susunan tetap (dua kolom: setup lebar, kolom samping Koneksi / Model / Jelajahi).

| Keadaan | Perilaku |
|---|---|
| Memuat | Skeleton kartu setup + kolom samping |
| Pengguna baru (tanpa key) | Langkah 2 aktif, pembuat request tetap terlihat di langkah 3 (status "todo") supaya pengguna bisa melihat bentuk kodenya |
| Sudah ada key, belum request | Langkah 3 aktif |
| Semua selesai | F3 |
| Katalog kosong | F6; "Model tersedia: 0" |

---

## 5. Data dan server

### 5.1 Fungsi (baru)

`setupProgress(userId)` di `src/lib/server/usage/` (folder pemakaian pengguna, U4), dua `exists` dalam satu query:
- `exists (select 1 from gateway_requests where user_id = $1 and api_key_id is not null and state = 'succeeded')`
- `exists (select 1 from api_keys where user_id = $1 and revoked_at is null and monthly_budget_micros is not null)`

Bersama `countActiveApiKeys`, `listCatalogForUsers` dijalankan paralel (`Promise.all`). Tanpa cache.

### 5.2 Halaman

`quick-start/page.tsx`: `getCurrentUser()`, data §5.1, base URL dari `authEnv().appOrigin`, di balik `<Suspense>`. View menerima data lewat props; `dashboard-data.ts` tidak dipakai lagi.

### 5.3 Endpoint

Tidak ada endpoint baru.

---

## 6. Keamanan

| Ancaman | Kontrol |
|---|---|
| Data pengguna lain | Semua query disaring `user_id` dari sesi |
| Margin terlihat | Harga yang dikirim hanya harga jual (`CatalogModel`) |
| Key di contoh kode | Contoh selalu memakai `$NBYTES_API_KEY` / `os.environ`, tidak pernah key asli |

---

## 7. Penyetelan desain (usulan Claude)

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | Logo provider di pembuat request dan Model populer | Nama model saja, id mono kecil | T3 |
| D2 | Pilihan model di pembuat request: `Segmented` berisi 4 model | `Select` bila model > 4, `Segmented` bila ≤ 4 | Katalog asli bisa berisi puluhan model; segmented control tidak muat |
| D3 | Bar progres: langkah selesai `bg-app-accent` | Bar langkah selesai `bg-app-success`, teks "N dari 4 selesai" tetap di sampingnya | T5: accent untuk aksi/seleksi; status pakai warna status + kata |
| D4 | Tautan "Kelola" / "Lihat" di Koneksi berwarna `app-accent-text` di dalam tombol ghost | Tetap (tautan boleh accent) | — |
| D5 | Langkah selesai hanya ditandai centang hijau + teks sr-only "Selesai" | Tetap; centang memakai `app-success` dan judul berwarna `app-text-2` | Sudah sesuai aturan (ikon + kata untuk screen reader) |
| D6 | Teks langkah 1 "Masuk dengan kode email ke {email}" | Tetap dengan email asli | — |

---

## 8. Dampak ke bagian lain

| Bagian | Dampak |
|---|---|
| `shared/dashboard-data.ts` | Setelah Quick Start tidak memakai `account` dan `apiKeys`, file ini tidak punya pemakai lagi (dicek dengan grep 2026-11-12: hanya Quick Start yang masih memakainya). Dihapus (aturan "No dead code") |
| `shared/build-snippet.ts` | Dipakai Quick Start dan Docs; tetap di `shared/` |
| `model-catalog.ts` | Quick Start berhenti memakainya; Docs masih memakai `BASE_URL` sampai PRD Docs dibangun; landing tetap memakai `BASE_URL` dan katalog contoh (dicek dengan grep), jadi file ini tidak dihapus |

---

## 9. Lokasi file

```
src/
  app/(dashboard)/quick-start/page.tsx              + Suspense, sesi, data §5.1, base URL
  components/dashboard/quick-start/
    quick-start-view.tsx                            langkah dari props, desain §7
    request-builder.tsx, connection-card.tsx,
    quick-start-aside.tsx                           data dari props
    quick-start-copy.ts                             teks baru (F3, F6)
    quick-start-skeleton.tsx                        baru
  components/dashboard/shared/dashboard-data.ts     dihapus
  lib/server/usage/setup-progress.ts                baru
```

Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| Q1 | Langkah 3 selesai hanya bila request berhasil **lewat API key** (Playground tidak dihitung)? | Ya: langkah ini tentang memakai API di aplikasi sendiri |
| Q2 | "Model populer" diganti apa? (a) model termurah, (b) model yang paling sering dipakai pengguna ini, (c) model unggulan pilihan admin (butuh kolom baru + migrasi), (d) dihapus | (a) 5 model dengan harga input terendah, judul "Model termurah". Data dari katalog, tanpa migrasi. Pembuat request memakai model pertama dari daftar yang sama |
| Q3 | Tambah langkah "Isi saldo" (R1)? | Ya |
| Q4 | Saat semua langkah selesai, kartu setup menyusut (F3)? | Ya |
| Q5 | R2 contoh streaming? | Tidak dulu |
| Q6 | Penyetelan desain D1–D6? | Diterima semua |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit
- Fungsi murni penentu langkah aktif: semua kombinasi (tanpa key, key tanpa request, request tanpa batas, semua selesai, dan dengan R1 saldo).

### 11.2 Integrasi (DB lokal, dev server)
- Pengguna baru → langkah key aktif, Koneksi "0" key.
- Tambah key → langkah request aktif.
- Request berhasil lewat key (Surplus tiruan) → langkah batas aktif; request Playground saja tidak menyelesaikan langkah 3.
- Pasang batas → semua selesai.
- Base URL di halaman = `APP_URL` + `/api/v1`; tidak ada `api.example.com`.
- Data uji dihapus setelahnya.

### 11.3 Kriteria penerimaan
- [ ] Tidak ada impor `dashboard-data` atau `model-catalog` di `components/dashboard/quick-start/`.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/app/(dashboard)/quick-start/page.tsx`, `src/components/dashboard/quick-start/*` (6 file) | mockup, status langkah tetap, model tetap, accent di bar progres | Dibaca |
| `src/components/dashboard/shared/build-snippet.ts`, `dashboard-data.ts` | contoh kode, `account`, `apiKeys` | Dibaca |
| `src/lib/server/gateway/api-keys.ts`, `catalog.ts` | `countActiveApiKeys`, `listCatalogForUsers`, `countActiveModels` | Dibangun dan dibaca hari ini |
| `src/app/(dashboard)/playground/page.tsx` | pola base URL dari `authEnv().appOrigin` | Dibangun hari ini |
| `src/lib/display-name.ts` | `displayName` | Dibaca |
| `src/app/globals.css` | token `app-on-accent` ada | Dicek dengan grep |
| `grep dashboard-data` di `src/` | hanya Quick Start yang masih memakainya | Dicek |
| `src/lib/auth/auth-contract.ts` | `DEFAULT_AFTER_LOGIN = "/quick-start"` | Dicek dengan grep |
| Jumlah model aktif di DB lokal | 0 saat 2026-11-12 | Dicek saat uji halaman Models |
