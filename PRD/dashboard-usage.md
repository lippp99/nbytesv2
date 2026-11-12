# PRD: Halaman Usage (dashboard pengguna) tersambung ke backend

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima. **Dibangun** 2026-11-12, termasuk R3 (per key) dan U5 (dihentikan terpisah dari error); uji integrasi §11.2 lolos di DB lokal lewat curl (belum dicek di browser) |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/usage`: ringkasan 30 hari, biaya per hari, pemakaian per model, dari tabel `gateway_requests` milik pengguna; penyetelan desain |
| Di luar cakupan | Ekspor CSV, pilihan periode lain, log request per baris, pemakaian per key (semuanya rekomendasi §3.2), Playground (PRD `dashboard-playground.md`), landing page |
| Bergantung pada | `PRD/gateway-api.md` §7 (setiap request inferensi mencatat satu baris), `PRD/gateway-pricing-billing.md` §9–§10 (tahan lalu tagih) |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Halaman Usage sudah punya tampilan lengkap: empat angka ringkasan, grafik biaya per hari, dan tabel per model. Semua angkanya contoh (`dashboard-data.ts`, `usage-data.ts`). Data asli sudah tercatat: setiap request ke gateway menulis satu baris `gateway_requests` berisi model, token, tagihan, status, dan durasi. Admin Overview sudah punya query sejenis untuk semua pengguna.

Tujuan: pengguna melihat pemakaian dan biaya aslinya, dengan angka yang sama dengan yang dipotong dari saldo.

---

## 2. Kondisi saat ini (bukti dari kode)

### 2.1 Mockup frontend

| Bagian | Isi sekarang | Sumber data mock |
|---|---|---|
| Route | `src/app/(dashboard)/usage/page.tsx` merender `<UsageView />` tanpa data | — |
| Ringkasan (`StatSummary`) | Biaya, Request (+ "41 error · 0,003%"), Token, "Latensi p50" | `usageTotals` di `shared/dashboard-data.ts` |
| Grafik "Biaya per hari" | 30 batang, sumbu Y kelipatan $5, tooltip, tabel untuk screen reader | `dailyCosts` di `usage/usage-data.ts` |
| Tabel "Per model" | Model (logo + id), Request, Token, Biaya, Porsi biaya (bar accent + %) | `usageByModel` + `modelById` dari `model-catalog.ts` |
| Proteksi | `/usage/:path*` sudah di matcher `src/proxy.ts` dan `DASHBOARD_PATHS` | — |

### 2.2 Data yang tersedia (`gateway_requests`)

| Kolom | Dipakai untuk |
|---|---|
| `user_id` (indeks `gateway_requests_user_id_idx`) | Hanya baris milik pengguna |
| `created_at` | Per hari |
| `model_id` | Per model |
| `state` (`pending` / `succeeded` / `failed`) | Jumlah error |
| `charge_micros` (null selama `pending`) | Biaya |
| `hold_micros` | Tahanan request yang masih berjalan |
| `input_tokens`, `output_tokens` (boleh null) | Token |
| `latency_ms` | Durasi |
| `api_key_id` (boleh null) | Pemakaian per key (rekomendasi R3) |

### 2.3 Temuan

| # | Temuan | Dampak |
|---|---|---|
| T1 | `latency_ms` diisi saat request **selesai ditagih** (`Date.now() - startedAt` di `upstream-outcome.ts`). Untuk streaming, ini durasi seluruh jawaban, bukan waktu sampai token pertama | Label "Latensi p50" menyesatkan. Usulan: "Durasi median" (D4) |
| T2 | `cost-chart.tsx` memakai `axisMax` kelipatan $5. Dengan biaya kecil (mis. $0,02/hari) semua batang hampir rata dengan dasar. Dengan 0 hari data: `Math.max()` dari array kosong = `-Infinity` | Grafik rusak untuk pengguna baru atau pemakai kecil |
| T3 | `src/components/app-kit/bar-chart.tsx` sudah ada (dipakai admin Overview, `overview-trends.tsx`): `niceMax` menangani 0 dan angka kecil, ada legenda dan tabel screen reader | Usage cukup memakai `BarChart` ini; `cost-chart.tsx` dihapus |
| T4 | Kolom Model memakai logo provider dari katalog contoh. `model_prices` tidak menyimpan provider (sama dengan PRD Models M1) | Logo dihapus; nama dari `model_prices`, id tetap tampil. Model yang sudah dimatikan admin tetap tampil dengan id-nya |
| T5 | Catatan error di `StatSummary` selalu merah (`tone: "danger"`), juga saat 0 error | Merah hanya bila error > 0 (D5) |
| T6 | Admin memakai hari **UTC** (`fillDays`, `trend`), batas bulanan key juga UTC | Usulan: hari UTC, ditulis jelas di halaman (§10 U1) |
| T7 | Pola query yang mirip sudah ada: `trend()` dan `topModels()` di `src/lib/server/admin-overview/trends.ts`, `percentile_disc(0.5)` di `figures.ts` | Query pengguna mengikuti pola yang sama, ditambah filter `user_id` |
| T8 | Request Playground (PRD `dashboard-playground.md`) juga akan menulis ke `gateway_requests` dan memotong saldo | Ikut terhitung di Usage |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Isi |
|---|---|---|
| F1 | Ringkasan 30 hari | Biaya (jumlah `charge_micros`), Request (jumlah baris), Error (`state = failed`, jumlah + persen), Token (input + output), Durasi median (`latency_ms`, request berhasil saja) |
| F2 | Biaya per hari | 30 hari UTC, hari kosong = 0, satu seri |
| F3 | Per model | Model (nama + id), Request, Token, Biaya, Porsi biaya; urut biaya terbesar |
| F4 | Request yang masih berjalan | Kalimat kecil bila ada: "N request masih berjalan, biayanya belum masuk." Tahanan tidak dihitung sebagai biaya |
| F5 | Belum ada pemakaian | `EmptyState`: "Belum ada request. Buat API key lalu kirim request pertama, atau coba di Playground." dengan tautan ke `/api-keys` dan `/playground` |
| F6 | Zona waktu | Satu kalimat: "Hari dihitung dalam UTC (07.00 WIB)." |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Pilihan periode 7 / 30 / 90 hari (`Segmented`) | Melihat tren lebih panjang atau lebih rinci | Kecil; query sama dengan parameter. 90 hari = 90 batang, perlu dicek muat di layar |
| R2 | Log request terbaru (50 terakhir: waktu, model, status, token, biaya, `x-request-id`) | Pengguna bisa mencari request gagal dan melaporkan id-nya ke support | Sedang: query + tabel + pagination. Pola ada di `admin-gateway/request-log.ts`. Kolom telemetri admin (`upstream_*`, biaya Surplus) **tidak boleh** dikirim |
| R3 | Pemakaian per key (dan "Playground") | Tahu key mana yang boros | Kecil: `GROUP BY api_key_id` + nama key |
| R4 | Ekspor CSV | Laporan keuangan | Sedang; route handler baru |

---

## 4. Isi halaman

Pola dashboard-design §6 "Lists and data".

1. `PageHeader`: h1 "Usage", deskripsi yang ada sekarang.
2. `StatSummary` (F1), lalu kalimat F4 bila ada.
3. Card "Biaya per hari" dengan `BarChart` dari `app-kit` (F2).
4. Card "Per model" dengan `Table` (F3).
5. Kalimat F6 di bawah.

| Keadaan | Perilaku |
|---|---|
| Memuat | Skeleton (ringkasan + card), pola `BillingSkeleton` |
| Belum ada request | F5 menggantikan grafik dan tabel; ringkasan tidak ditampilkan |
| Ada request, semua gagal | Biaya $0.00, error 100% dengan kata "error", grafik rata 0 |
| Database gagal | Tidak ada data contoh sebagai cadangan. Dashboard belum punya `error.tsx`, jadi yang tampil halaman error bawaan Next |

---

## 5. Data dan server

### 5.1 Fungsi (baru)

`src/lib/server/gateway/user-usage.ts` (`import "server-only"`), semua query disaring `user_id` dari sesi:

| Fungsi | Query |
|---|---|
| `usageSummary(userId, now)` | Satu baris: `sum(charge_micros)`, `count(*)`, `count(*) filter (where state='failed')`, `count(*) filter (where state='pending')`, `sum(coalesce(input_tokens,0)+coalesce(output_tokens,0))`, `percentile_disc(0.5) within group (order by latency_ms) filter (where state='succeeded')` |
| `usageByDay(userId, now)` | `GROUP BY` hari UTC, lalu isi hari kosong (pola `fillDays`) |
| `usageByModel(userId, now)` | `GROUP BY model_id`, `LEFT JOIN model_prices` untuk nama, urut biaya |

Ketiganya dijalankan paralel (`Promise.all`). Tanpa cache: setiap muat ulang membaca database (sama dengan Billing).

### 5.2 Kontrak

`src/lib/usage-contract.ts` (client-safe): tipe `UsageSummary`, `UsageDay`, `ModelUsage`, konstanta `USAGE_DAYS = 30`, dan fungsi murni pengisi hari kosong + persen error (dengan test). Kolom yang tidak dikirim ke klien: `surplus_cost_micros`, `upstream_*`, `hold_micros` per baris, `user_id`.

### 5.3 Halaman

`src/app/(dashboard)/usage/page.tsx`: `getCurrentUser()` lalu tiga query di balik `<Suspense>`, kirim hasil ke `UsageView`. Pola sama dengan `billing/page.tsx`.

### 5.4 Endpoint

Tidak ada endpoint baru untuk v1.

---

## 6. Keamanan

| Ancaman | Kontrol |
|---|---|
| Melihat pemakaian orang lain | Semua query memakai `user_id` dari sesi server, tidak ada id dari URL |
| Bocornya margin nbytes | Biaya Surplus dan telemetri upstream tidak dikirim (§5.2) |
| Halaman tanpa login | Proxy + `getCurrentUser()` di halaman |

---

## 7. Penyetelan desain (usulan Claude)

Mengikuti `.claude/rules/dashboard-design.md`.

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | `cost-chart.tsx` sendiri, sumbu kelipatan $5 | `BarChart` dari `app-kit` (satu seri, warna accent), `cost-chart.tsx` dihapus | T2, T3; satu komponen grafik untuk dashboard dan admin (§7 rules) |
| D2 | Logo provider di kolom Model | Nama model + id mono kecil di bawahnya, tanpa logo | T4; sama dengan halaman Models |
| D3 | Bar "Porsi biaya" berwarna accent | Bar netral `app-text-3` | Accent sudah dipakai grafik di atasnya; bar porsi hanya mengulang kolom Biaya, jadi tidak perlu warna penekanan |
| D4 | "Latensi p50" | "Durasi median", dengan keterangan kecil "dari kirim sampai jawaban selesai" | T1: angka ini bukan latensi token pertama |
| D5 | Catatan error selalu merah, persen 3 desimal (`0,003%`) | Merah hanya bila error > 0; persen 1 desimal, "<0,1%" bila di bawahnya | T5; angka lebih mudah dibaca |
| D6 | Judul ringkasan tanpa periode yang terlihat | Deskripsi card grafik: "30 hari terakhir (UTC), dalam USD" | F6 |
| D7 | Tabel tanpa `minWidth` (default `min-w-2xl`) | Tetap | Kolom sudah sedikit |

Kontras warna tidak berubah (token yang dipakai sudah diukur di `dashboard-design.md` §3).

---

## 8. Dampak ke bagian lain

| Bagian | Dampak |
|---|---|
| `shared/dashboard-data.ts` | `usageByModel`, `usageTotals`, `ModelUsage` hanya dipakai `usage-view.tsx` (dicek dengan grep 2026-11-12), jadi dihapus bersama (aturan "No dead code") |
| `usage/usage-data.ts`, `usage/cost-chart.tsx` | Dihapus |
| Landing | Tidak tersentuh |

---

## 9. Lokasi file

```
src/
  app/(dashboard)/usage/page.tsx                   + Suspense, getCurrentUser, 3 query
  components/dashboard/usage/
    usage-view.tsx                                 terima data dari server; BarChart; desain §7
    usage-copy.ts                                  teks baru (F4–F6, D4–D6)
    usage-skeleton.tsx                             baru
    cost-chart.tsx, usage-data.ts                  dihapus
  lib/
    usage-contract.ts (+ .test.ts)                 baru
    server/gateway/user-usage.ts                   baru
```

`src/lib/server/gateway/` akan berisi 12 file (batas ~10). Usulan: `user-usage.ts` di folder baru `src/lib/server/usage/` (§10 U4). Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| U1 | Hari dihitung UTC (sama dengan admin dan batas key) atau WIB? | UTC, ditulis di halaman |
| U2 | Rekomendasi R1–R4 masuk v1? | R3 (per key) ya karena kecil; R1, R2, R4 fase berikutnya |
| U3 | Penyetelan desain D1–D7? | Diterima semua |
| U4 | Lokasi query: `lib/server/usage/` (folder baru) atau `lib/server/gateway/`? | `lib/server/usage/` |
| U5 | Request yang dihentikan pengguna di tengah stream tercatat `failed` (`client_disconnected`) dan tetap ditagih tahanan bila usage belum datang (`stream-proxy.ts`). Dihitung sebagai "error" di ringkasan? | Tidak: hitung hanya error selain `client_disconnected`, dan tampilkan terpisah sebagai "dihentikan" |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit
- Isi hari kosong: 0 baris → 30 hari bernilai 0; hari pertama dan terakhir benar di batas bulan.
- Persen error: 0 request, 0 error, 1 dari 3, "<0,1%".

### 11.2 Integrasi (DB lokal, dev server)
- Tanpa sesi → `/usage` dialihkan ke `/login?next=%2Fusage`.
- Pengguna tanpa request → F5.
- Baris uji: 2 berhasil, 1 gagal, 1 pending, 1 dari 31 hari lalu, 1 milik pengguna lain → ringkasan hanya menghitung milik pengguna dalam 30 hari; pending tidak masuk biaya.
- Biaya total di halaman = jumlah `charge_micros` di DB untuk pengguna itu.
- Payload tidak memuat `surplus_cost_micros` atau telemetri.
- Data uji dihapus setelahnya.

### 11.3 Kriteria penerimaan
- [ ] Tidak ada impor `dashboard-data` atau `model-catalog` di `components/dashboard/usage/`.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/app/(dashboard)/usage/page.tsx`, `src/components/dashboard/usage/*` (4 file) | mockup, `axisMax`, tone danger, logo provider | Dibaca |
| `src/components/dashboard/shared/dashboard-data.ts` | `usageByModel`, `usageTotals` contoh | Dibaca |
| `src/components/app-kit/bar-chart.tsx`, `stat-summary.tsx` | `niceMax`; `BarChart` hanya dipakai `admin/overview/overview-trends.tsx` | Dibaca, pemakai dicek dengan grep |
| `src/lib/server/db/schema/gateway.ts` | kolom dan indeks `gateway_requests` | Dibaca |
| `src/lib/server/admin-overview/trends.ts`, `figures.ts`, `src/lib/admin-overview-contract.ts` | pola query, `fillDays`, `percentile_disc` | Dibaca |
| `src/lib/server/admin-gateway/request-log.ts` | pola log request (R2) | Dibaca |
| `src/lib/server/gateway/upstream-outcome.ts`, `stream-proxy.ts` | arti `latency_ms`, `client_disconnected` | Dibaca |
| `src/proxy.ts`, `src/lib/auth/auth-contract.ts` | `/usage` sudah dilindungi | Dibaca |
| Jumlah baris `gateway_requests` di DB lokal | — | **Tidak diketahui** (DB tidak dicek untuk PRD ini) |
| Tampilan 90 batang (R1) | — | **Belum dibuktikan** |
