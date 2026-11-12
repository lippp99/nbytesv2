# PRD: Halaman Models (dashboard pengguna) tersambung ke backend

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima. **Dibangun** 2026-11-12, termasuk sortir harga (M2) dan angka model asli di sidebar; uji integrasi §11.2 lolos di DB lokal lewat curl (belum dicek di browser). DB lokal saat itu punya 0 model aktif |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/models`: daftar model aktif dari katalog yang dikurasi admin (tabel `model_prices`) dengan harga jual nbytes, pencarian, salin id model, penyetelan desain |
| Di luar cakupan | Halaman detail per model, perbandingan model, Playground, Quick Start, Usage, landing page (tetap memakai `mockModels`), mengubah katalog (itu halaman admin) |
| Bergantung pada | `PRD/gateway-api.md` §6 (id model persis, katalog dikurasi D4), `PRD/gateway-pricing-billing.md` §7.1 (harga jual = list × (1 + markup)) |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Halaman Models menampilkan 12 model contoh dari `src/lib/model-catalog.ts`. Katalog asli sudah ada di database: admin mengaktifkan model dan memasang markup, lalu gateway hanya menerima model yang aktif. Fungsi `listPublicModels()` sudah membaca katalog itu untuk `GET /api/v1/models`.

Tujuan: pengguna melihat **persis** model yang bisa ia panggil, dengan harga yang benar-benar ditagihkan, dan bisa menyalin id model yang tepat. Model yang tampil di halaman harus sama dengan yang diterima gateway.

---

## 2. Kondisi saat ini (bukti dari kode)

| Hal | Isi kode sekarang | Dampak |
|---|---|---|
| Route | `src/app/(dashboard)/models/page.tsx` hanya merender `<ModelsView />` | Perlu pembaca data di balik `<Suspense>` |
| Data | `models-view.tsx` (client) memakai `mockModels`, `mockProviders`, `providerById`, `capabilityLabels` | Diganti data asli |
| Kolom sekarang | Model (logo, nama, id + salin), Provider, Konteks, Input, Output, Fitur | Tidak semua ada di database (baris berikut) |
| Tabel `model_prices` | `model_id`, `name`, `context_length` (boleh null), `max_completion_tokens` (boleh null), `supports_images`, harga list, `markup_bp`, `input_micros`, `output_micros` (harga jual per 1M token), `active` | Sumber halaman ini |
| Provider | **Tidak disimpan** di `model_prices`. Halaman admin membaca `provider` langsung dari katalog Surplus saat dibuka (`catalog-admin.ts`) | Kolom dan filter Provider tidak bisa diisi tanpa perubahan (§10 M1) |
| Logo | `ProviderLogo` memakai id ikon di `public/models/` (mis. `openai`, `claude`, `gemini`). Tidak ada pemetaan dari model asli ke ikon | Logo tidak bisa diisi tanpa pemetaan (§10 M1) |
| Fitur | Database hanya tahu `supports_images`. "Tool calling", "Reasoning", "JSON mode", "Streaming" per model **tidak disimpan** | Hanya badge "Input gambar" yang bisa jujur ditampilkan |
| Fungsi server | `listPublicModels()` (aktif saja, urut `model_id`) mengembalikan bentuk OpenAI: harga sebagai string "USD per token", tanpa `supports_images` dan `max_completion_tokens` | Halaman butuh fungsi sendiri dengan micro-USD per 1M (§5) |
| Format | `formatMicros` (2–6 desimal, tanpa float); `formatContext(tokens: number)` tidak menerima `null` | Konteks kosong ditampilkan "—" |
| Proteksi halaman | `/models` (persis, tanpa `:path*`, karena `public/models/*.svg`) sudah di matcher `src/proxy.ts` dan `DASHBOARD_PATHS` | Tidak perlu diubah |
| Pemakai `model-catalog.ts` | Selain halaman ini: Playground, Quick Start, Usage, Docs, sidebar, dan **11 file landing** | `model-catalog.ts` tidak diubah; hanya halaman Models yang berhenti memakainya |
| Angka di sidebar | `sidebar-nav.tsx`: jumlah model = `mockModels.length` | Lihat §8 |
| Jumlah model aktif di DB lokal | — | **Tidak diketahui** (DB tidak dicek saat PRD ini ditulis) |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Keterangan |
|---|---|---|
| F1 | Daftar model aktif | Hanya `active = true`. Model yang dimatikan admin langsung hilang dari halaman |
| F2 | Harga jual | Input dan output per 1 juta token dari `input_micros` / `output_micros`. Harga list dan markup **tidak pernah** dikirim ke klien |
| F3 | Salin id model | Id persis yang diterima gateway (alias ditolak, gateway-api §6). Sudah ada `CopyButton` |
| F4 | Pencarian | Nama atau id, di klien (sudah ada) |
| F5 | Konteks dan maks output | `context_length` dan `max_completion_tokens`; kosong → "—" |
| F6 | Input gambar | Badge "Input gambar" bila `supports_images` |
| F7 | Jumlah | "N model" / "N dari M model" (sudah ada) |
| F8 | Katalog kosong | `EmptyState`: "Belum ada model yang tersedia. Hubungi admin." (teks usulan) |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Provider + logo + filter provider | Memudahkan mencari model dari satu vendor | Kolom `provider` baru di `model_prices` (migrasi), diisi saat admin mengaktifkan model, + pemetaan provider → ikon. Nilai `provider` dari Surplus **belum dibuktikan** (belum pernah dilihat isinya) |
| R2 | Urutkan berdasarkan harga input/output | Pengguna sering memilih model termurah | Kecil, di klien. Header kolom jadi tombol sortir |
| R3 | Contoh request singkat di bawah tabel (`curl` dengan id model terpilih) | Menghubungkan id ke cara pakai | Base URL produksi **belum diputuskan** (gateway-api A1); `BASE_URL` di kode masih `https://api.example.com/v1`. Tunggu domain |

---

## 4. Isi halaman

Pola dashboard-design §6 "Lists and data": tabel di dalam card.

### 4.1 Header (`PageHeader`)

- h1 "Models", deskripsi yang ada sekarang ("Semua model yang bisa dipanggil dengan satu key. Harga dalam USD per 1 juta token.").

### 4.2 Toolbar (di atas tabel, di dalam card)

- Kolom cari (sudah ada).
- Filter provider: **dihapus** di v1 bila R1 tidak diambil.
- Jumlah model di kanan (sudah ada).

### 4.3 Tabel

| Kolom | Isi | Sumber |
|---|---|---|
| Model | Nama; di bawahnya id mono + tombol salin | `name`, `model_id` |
| Konteks | mis. `200K`, atau "—" | `context_length` |
| Maks output | mis. `64K`, atau "—" | `max_completion_tokens` |
| Input / 1M | `$3.00` | `input_micros` |
| Output / 1M | `$15.00` | `output_micros` |
| Fitur | Badge "Input gambar" atau kosong | `supports_images` |

- Urutan: nama A–Z (**usulan**; sekarang `listPublicModels` mengurutkan `model_id`).
- Tanpa pagination di v1. Jumlah model aktif **tidak diketahui**; bila lebih dari ~100, pertimbangkan ulang (§10 M4).
- Angka harga dan konteks rata kanan, `tabular-nums`.

### 4.4 Status

| Keadaan | Perilaku |
|---|---|
| Memuat | Skeleton tabel di dalam card |
| Cari tanpa hasil | `EmptyState` yang ada sekarang + "Reset filter" |
| Katalog kosong | F8 |
| Database gagal | Tidak ada data contoh sebagai cadangan. Dashboard belum punya `error.tsx` (dicek: tidak ada di `src/app`), jadi yang tampil adalah halaman error bawaan Next. Membuat `error.tsx` untuk dashboard di luar cakupan PRD ini |

---

## 5. Data dan server

### 5.1 Fungsi daftar (baru)

`listCatalogForUsers()` di `src/lib/server/gateway/catalog.ts`:
- `model_prices` dengan `active = true`.
- DTO sempit ke klien:

```ts
type CatalogModel = {
  id: string;                         // model_id
  name: string;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  supportsImages: boolean;
  inputMicros: number;                // harga jual per 1M token
  outputMicros: number;
};
```

`list_input_micros`, `list_output_micros`, `markup_bp` tidak dikirim: itu margin nbytes.

Kenapa tidak memakai `listPublicModels()`: bentuknya untuk API OpenAI (harga string per token, tanpa `supports_images` dan maks output). Mengubahnya akan mengubah respons publik `/api/v1/models`.

### 5.2 Halaman

`src/app/(dashboard)/models/page.tsx` (Server Component): `getCurrentUser()` lalu `listCatalogForUsers()` di balik `<Suspense>` (wajib dengan `cacheComponents`), lalu kirim DTO ke `ModelsView` (client, untuk cari dan salin).

Cache: **tanpa cache** di v1 (**usulan**). Harga berubah saat admin menyimpan markup, dan halaman harus sama dengan yang ditagihkan. Kalau nanti perlu, pakai `use cache` + `cacheTag` dan `revalidateTag` saat admin menyimpan; itu perlu dibaca dulu di docs Next yang terpasang.

### 5.3 Endpoint

Tidak ada endpoint baru.

---

## 6. Keamanan

| Ancaman | Kontrol |
|---|---|
| Kebocoran margin | DTO tanpa harga list dan markup (§5.1) |
| Model nonaktif terlihat atau dipanggil | Query hanya `active = true`, sama dengan `activeModel()` di gateway |
| Halaman tanpa login | Proxy (`/models`) + `getCurrentUser()` di halaman |
| `public/models/*.svg` ikut dialihkan ke login | Matcher tetap `/models` persis (komentar di `proxy.ts`), tidak diubah |

---

## 7. Penyetelan desain (usulan Claude)

Semua mengikuti `.claude/rules/dashboard-design.md`. Komponen dari `app-kit`.

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | Kotak logo 36px di setiap baris | Dihapus di v1 (kembali bila R1 diambil) | Tanpa provider tidak ada logo yang benar; kotak kosong atau logo salah lebih buruk daripada tidak ada |
| D2 | Kolom "Provider" + filter provider | Dihapus di v1 | Data tidak ada (§2) |
| D3 | 4–5 badge fitur per baris (Tool calling, Reasoning, …) | Hanya "Input gambar" | Hanya itu yang tercatat; badge lain tidak bisa dibuktikan |
| D4 | Header harga "Input" / "Output" | "Input / 1M" / "Output / 1M" (sama dengan halaman admin: "Input / 1M token") | Satuan terbaca di kolomnya sendiri, tidak hanya di deskripsi halaman |
| D5 | Tidak ada kolom maks output | Kolom "Maks output" | Data ada dan berguna untuk memilih model |
| D6 | Tabel `min-w-4xl` | `min-w-3xl` (jumlah kolom tetap 6, tetapi kotak logo dan kolom Provider hilang, diganti "Maks output" yang sempit) | Lebih sedikit geser samping di HP; tetap geser di dalam card, konsisten dengan tabel lain |
| D7 | Id model di bawah nama, `text-app-small` mono | Tetap; tombol salin tetap ikon dengan label untuk screen reader | Id adalah hal yang paling sering disalin |
| D8 | Urutan sesuai data contoh | Nama A–Z, atau sortir harga bila R2 diambil | Mudah dipindai |

Ukuran `min-w-3xl` di D6 adalah perkiraan; dicek di 375px dan 1200px saat implementasi (**belum dibuktikan**).

---

## 8. Dampak ke bagian lain

| Bagian | Dampak | Usulan |
|---|---|---|
| Angka model di sidebar (`sidebar-nav.tsx`) | Masih `mockModels.length` | Disambungkan bersama angka key (PRD `dashboard-api-keys.md` §10 K4) atau dihapus |
| Playground, Quick Start, Usage, Docs | Tetap memakai `mockModels` / `modelById` | Tidak diubah di PRD ini. Catatan: setelah halaman Models asli, Playground masih menawarkan model contoh yang mungkin tidak aktif. Diatasi di PRD Playground |
| Landing page | Memakai `model-catalog.ts` | Tidak tersentuh (`model-catalog.ts` tidak diubah) |
| `capabilityLabels`, `mockProviders` | Tidak dipakai lagi oleh halaman ini | Tetap ada selama landing/halaman lain memakainya |

---

## 9. Lokasi file (sesuai `architecture.md`)

```
src/
  app/(dashboard)/models/page.tsx                  + Suspense, getCurrentUser, listCatalogForUsers
  components/dashboard/models/
    models-view.tsx                                terima models dari server; tanpa model-catalog; desain §7
    models-copy.ts                                 kolom baru, teks katalog kosong
    models-skeleton.tsx                            baru: skeleton tabel
  lib/
    gateway/catalog-contract.ts                    + tipe CatalogModel
    server/gateway/catalog.ts                      + listCatalogForUsers
```

`lib/gateway/` sudah 10 file; PRD ini tidak menambah file di sana (hanya tipe di file yang ada). Bila R1 diambil: kolom baru di `src/lib/server/db/schema/gateway.ts` → `npm run db:generate` → tinjau SQL → `npm run db:migrate` (lokal saja tanpa izin owner). Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| M1 | Provider, logo, dan filter provider (R1): v1 tanpa itu, atau tambah kolom `provider` (migrasi) sekarang? | v1 tanpa provider. Bila diambil, saya cek dulu isi `provider` di katalog Surplus sebelum menulis skema |
| M2 | Sortir harga (R2) masuk v1? | Ya, kecil |
| M3 | Contoh `curl` (R3)? | Tunda sampai domain produksi diputuskan |
| M4 | Tanpa pagination di v1? | Ya, dicek ulang setelah tahu jumlah model aktif |
| M5 | Penyetelan desain D1–D8? | Diterima semua |
| M6 | Teks katalog kosong (F8) "Belum ada model yang tersedia. Hubungi admin."? | Ya, atau teks dari owner |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit
- Format konteks dan maks output: angka, `null` → "—".
- Pencarian: cocok nama, cocok id, huruf besar/kecil.

### 11.2 Integrasi (DB lokal, dev server)
- Tanpa sesi → `/models` dialihkan ke `/login?next=%2Fmodels`.
- Model aktif di admin → muncul; dimatikan di admin → hilang setelah muat ulang.
- Harga di halaman = `input_micros` / `output_micros` model itu.
- Payload halaman tidak memuat `list_input_micros`, `list_output_micros`, `markup_bp`.
- Id yang disalin diterima `GET /api/v1/models/{id}` dengan key valid.
- `public/models/openai.svg` tetap bisa dibuka tanpa login.

### 11.3 Kriteria penerimaan
- [ ] `components/dashboard/models/` tidak mengimpor `model-catalog`.
- [ ] Jumlah baris = jumlah `model_prices` dengan `active = true`.
- [ ] Semua keadaan di §4.4 muncul.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing (dashboard-design §2) bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/app/(dashboard)/models/page.tsx` | route tanpa data | Dibaca |
| `src/components/dashboard/models/models-view.tsx`, `models-copy.ts` | kolom, filter, `min-w-4xl`, badge fitur | Dibaca |
| `src/lib/model-catalog.ts` | 12 model contoh, `BASE_URL` contoh | Dibaca |
| `grep model-catalog` di `src/` | pemakai lain, termasuk 11 file landing | Dicek |
| `src/lib/server/db/schema/gateway.ts` | kolom `model_prices`, tanpa provider | Dibaca |
| `src/lib/server/gateway/catalog.ts` | `listPublicModels`, `activeModel` | Dibaca |
| `src/lib/gateway/catalog-contract.ts` | `PublicModel`, `SurplusTextModel.provider` | Dibaca |
| `src/lib/server/admin-gateway/catalog-admin.ts`, `components/admin/models/catalog-table.tsx`, `models-copy.ts` | provider dibaca live dari Surplus; label "Input / 1M token" | Dibaca |
| `public/models/` | id ikon yang tersedia | Dicek |
| `src/proxy.ts`, `src/lib/auth/auth-contract.ts` | `/models` persis, alasan `public/models` | Dibaca |
| `src/lib/price-format.ts`, `src/lib/model-format.ts` | `formatMicros`, `formatContext` tanpa `null` | Dibaca |
| `PRD/gateway-api.md` §4, §6, A1 | id persis, domain belum diputuskan | Dibaca |
| Isi `provider` di katalog Surplus | — | **Belum dibuktikan** |
| Jumlah model aktif di DB | — | **Tidak diketahui** |
| Perilaku di browser | — | **Belum dibuktikan** (belum dibangun) |
