# PRD: Ringkasan admin (`/admin`) dengan data nyata

| | |
|---|---|
| Status | v3. K1–K5 diputuskan owner 2026-11-12 (§8) dan **dibangun** hari itu (§11). |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | Isi halaman Ringkasan admin: angka utama, kesehatan uang, tren, model dan pengguna teratas, peringatan |
| Di luar cakupan | Navigasi cepat ke halaman lain (owner, 2026-11-12: tidak mau ada di Ringkasan), notifikasi email/Slack, ekspor, auto-refresh |
| Bergantung pada | `PRD/gateway-pricing-billing.md` (§5, §8, §10, B7, B9), `PRD/gateway-api.md`, `PRD/admin-requests-upstream.md` (R5), `PRD/admin-users-audit.md`, `PRD/backend-auth-admin.md` (A.7) |

Setiap klaim tentang kode berasal dari berkas yang dibuka saat PRD ini ditulis (§10). Yang tidak bisa dibuktikan ditandai
**belum dibuktikan**; bagian **usulan** bisa diganti owner.

---

## 1. Kondisi saat ini (bukti)

Halaman ini **mockup penuh**: `src/app/admin/(console)/page.tsx` merender `OverviewView` tanpa membaca DB.

| Bagian mockup | Isi | Masalah |
|---|---|---|
| 4 angka utama | Pendapatan bulan ini $48.216,40 "+12% dari Oktober", 1.284 pengguna aktif, 412.612 request 24 jam, error 0,61% "naik karena xAI gangguan" | Semua angka karangan (`overviewFigures` di `overview-copy.ts`) |
| Status provider | 6 provider dengan status, latensi, error | Data contoh `shared/provider-health.ts`; provider sudah diganti Upstream (R1), identitas penjual disembunyikan Surplus |
| Peringatan | 4 contoh: "xAI ... Fallback aktif", "Latensi Google", "3 akun Paket Pro saldo < $5", "5 percobaan TOTP gagal" | Fallback dan paket tidak ada di sistem |
| Tautan "Lihat semua" ke `/admin/upstream` | Navigasi cepat | Owner tidak mau navigasi cepat di Ringkasan: dihapus |
| Subjudul "diperbarui tiap menit" | | Tidak ada pembaruan otomatis; halaman dihitung saat dibuka |

`shared/provider-health.ts` hanya dipakai halaman ini (grep); ikut dihapus.

## 2. Data nyata yang sudah ada

| Sumber | Bisa dipakai untuk | Bukti |
|---|---|---|
| `gateway_requests` | Request, gagal, latensi, token, tagihan ke pengguna, biaya Surplus (boleh kosong), margin, per model/per pengguna/per hari | `schema/gateway.ts` |
| `user_balances` | Total saldo pengguna (kewajiban prabayar nbytes) dan total ditahan; saldo negatif (B7) | `schema/billing.ts` |
| `deposits` | Deposit masuk (rupiah, biaya Sumopod, kredit USD), deposit menunggu dan macet (B9) | `schema/billing.ts`, `payments/finance-report.ts` (`depositSummary` sudah menghitung sebagian) |
| `payment_webhook_events` | Webhook yang tidak cocok (`mismatch`, `unknown_order`) | `schema/billing.ts`, `apply-webhook.ts` |
| `exchange_rates` | Kurs berlaku dan kapan diubah; tanpa baris = deposit ditolak | `payments/exchange-rate.ts` |
| `users`, `api_keys`, `sessions` | Total akun, akun baru, ditangguhkan, key aktif | `schema/auth.ts`, `schema/gateway.ts` |
| `admin_audit_events` | Login admin gagal / dikunci | `admin-auth/audit.ts` |
| `model_prices` | Model aktif | `schema/gateway.ts` |
| Surplus `GET /v1/payments/balance` | Saldo kredit nbytes di Surplus | dipakai halaman Upstream; diuji ke Surplus asli 2026-11-12 |

Isi DB lokal saat ini (query `count(*)`, 2026-11-12): `gateway_requests` 0, `deposits` 0, `exchange_rates` **0** (kurs belum
pernah diisi, jadi deposit ditolak), `users` 1, `user_balances` 0. Semua bagian harus punya tampilan kosong yang benar.

## 3. Isi halaman (K1–K5 diputuskan)

Urutan dari atas. Tidak ada tombol atau tautan ke halaman lain; setiap angka bisa dibaca di tempat.

### 3.1 Angka utama (dua baris `StatSummary`)

**Bulan ini (UTC, sejak tanggal 1):**

| Angka | Rumus |
|---|---|
| Pemakaian ditagih | `sum(charge_micros)` request bulan ini |
| Biaya Surplus | `sum(surplus_cost_micros)` yang diketahui; catatan "N request biaya menunggu" bila ada |
| Margin kotor | tagihan − biaya, **hanya** dari request yang biayanya diketahui, plus persen margin (billing §10.3) |
| Deposit masuk | `sum(amount_idr + fee_idr)` deposit `paid` bulan ini, catatan kredit USD yang diberikan |

**24 jam terakhir dan pengguna:**

| Angka | Rumus |
|---|---|
| Request 24 jam | jumlah baris `gateway_requests` |
| Gagal 24 jam | persen `state = failed`; catatan berapa yang salah nbytes (`service_unavailable`) |
| Latensi p50 24 jam | `percentile_disc(0.5)` dari `latency_ms` |
| Pengguna | total akun; catatan "N aktif 30 hari, N baru bulan ini, N ditangguhkan" (definisi aktif: K2) |

Tidak ada pembanding "+12% dari bulan lalu" sampai owner memintanya (bulan pertama tidak punya pembanding).

### 3.2 Kesehatan uang (kartu)

| Baris | Isi |
|---|---|
| Saldo nbytes di Surplus | dari Surplus (sama dengan halaman Upstream); gagal dibaca → "tidak bisa dibaca" |
| Total saldo pengguna | `sum(balance_micros)` (uang prabayar yang wajib bisa dipakai pengguna) dan total ditahan |
| Cakupan | saldo Surplus ÷ total saldo pengguna. Di bawah 100% berarti kalau semua pengguna memakai saldonya, kredit Surplus tidak cukup (K4) |
| Saldo negatif | jumlah akun dengan saldo < 0 (B7) |
| Kurs berlaku | Rp per USD dan kapan diubah; kosong → peringatan |
| Deposit | menunggu, macet (lewat kedaluwarsa, B9) |

### 3.3 Tren 30 hari (dua grafik batang, per hari UTC)

1. Pemakaian ditagih vs biaya Surplus per hari (dua seri, legenda, tabel yang sama untuk pembaca layar).
2. Request per hari dengan bagian gagal.

Grafik dibuat sesuai skill `dataviz` dan token dashboard. Pola batang sudah ada di `src/components/dashboard/usage/cost-chart.tsx`
(CSS, tanpa library), tetapi berada di area dashboard pengguna dan tidak boleh diimpor dari admin (`architecture.md` §3);
komponen grafik baru di `app-kit` (usulan). Tidak menambah dependensi.

### 3.4 Teratas bulan ini (dua tabel, 5 baris)

- **Model:** request, token input/output, tagihan, biaya Surplus, margin.
- **Pengguna:** email, request, tagihan, saldo sekarang.

### 3.5 Peringatan (dihitung saat halaman dibuka)

Hanya teks dengan badge titik + kata, tanpa tautan. Kosong → "Tidak ada yang perlu ditindaklanjuti".

| Peringatan | Aturan | Sumber |
|---|---|---|
| Saldo Surplus tidak menutup saldo pengguna | cakupan < ambang (K4) | §3.2 |
| Saldo Surplus tidak bisa dibaca | panggilan gagal | Surplus |
| Masalah key/kredit Surplus | request `service_unavailable` 24 jam | `gateway_requests` |
| Margin negatif | request 24 jam dengan tagihan < biaya | `gateway_requests` |
| Biaya menunggu lama | `cost_status = pending` lebih dari 24 jam (rekonsiliasi belum ada, A6) | `gateway_requests` |
| Deposit macet | `pending` lewat `expires_at` (B9) | `deposits` |
| Webhook tidak cocok | `mismatch` / `unknown_order` 7 hari | `payment_webhook_events` |
| Kurs belum diisi | tidak ada baris | `exchange_rates` |
| Login admin dikunci / TOTP gagal | `locked`, `totp_failed` 24 jam | `admin_audit_events` |
| Saldo negatif | akun dengan saldo < 0 | `user_balances` |

Tidak termasuk: "harga list Surplus berubah" (butuh membaca katalog 473 KB setiap buka Ringkasan; tetap di halaman Model & harga).

## 4. Teknis

- Server Component; `getCurrentAdmin()` di samping data. Tiap bagian di `Suspense` sendiri dengan kerangka, supaya Surplus
  yang lambat tidak menahan angka dari DB. Query agregat paralel (`Promise.all`), tanpa N+1.
- Uang tetap integer mikrodolar/rupiah; jumlah `bigint` dibaca sebagai number (aman di bawah 2^53, pola `finance-report.ts`).
- Berkas (usulan): `src/lib/server/admin-overview/{figures,trends,alerts}.ts`, kontrak `src/lib/admin-overview-contract.ts`
  (+ test untuk rumus margin, cakupan, aturan peringatan), UI `src/components/admin/overview/*`, grafik
  `src/components/app-kit/bar-chart.tsx`. `overview-copy.ts` tanpa angka contoh; `shared/provider-health.ts` dihapus.
- Indeks: `gateway_requests_created_at_idx` dan `gateway_requests_state_created_idx` ada untuk rentang waktu. `deposits`
  hanya punya indeks `user_id` dan `sumopod_payment_id` (tidak ada indeks status/waktu); cukup selama datanya kecil, dicek
  dengan `EXPLAIN` saat dibangun.

## 5. Keamanan

Hanya baca. Email pengguna tampil penuh hanya untuk Owner. Tidak ada hash, token, atau key.

## 6. Kriteria selesai

- Tidak ada angka contoh, data provider contoh, atau tautan ke halaman lain di Ringkasan.
- Semua bagian punya tampilan kosong yang benar (DB lokal saat ini hampir kosong).
- `npx tsc --noEmit`, `npm run lint`, test lolos; diuji lewat HTTP dengan data uji lalu dihapus.

## 7. Belum dibuktikan

- Berapa lama halaman dimuat dengan data besar (belum ada data nyata).
- Saldo Surplus sebagai "cakupan": saldo kredit Surplus bisa juga dipakai untuk hal lain di akun Surplus nbytes; tidak
  diketahui apakah ada pemakaian lain.

## 8. Keputusan yang dibutuhkan

| # | Pertanyaan | Usulan |
|---|---|---|
| K1 | "Pendapatan" berarti apa? | **Diputuskan:** keduanya terpisah: pemakaian ditagih (USD) dan deposit masuk (IDR), plus biaya Surplus dan margin |
| K2 | "Pengguna aktif" | **Diputuskan:** minimal 1 request API dalam 30 hari |
| K3 | Periode | **Diputuskan:** tetap: bulan ini + 24 jam + tren 30 hari, tanpa pemilih periode |
| K4 | Ambang peringatan saldo Surplus | **Diputuskan:** saldo Surplus < total saldo pengguna (cakupan < 100%) |
| K5 | Grafik tren 30 hari | **Diputuskan:** ya, dua grafik (§3.3), bagian dari jawaban K3 |

## 9. Hubungan dengan PRD lain

Menutup R5 di `admin-requests-upstream.md` bila disetujui. Angka deposit memakai aturan yang sama dengan halaman Keuangan.

## 11. Status pembangunan (2026-11-12)

- Query: `src/lib/server/admin-overview/{figures,trends,alerts}.ts`; rumus murni (margin, cakupan, aturan peringatan,
  pengisian hari kosong) di `src/lib/admin-overview-contract.ts` + test. Saldo Surplus memakai `surplusBalance()` milik
  halaman Upstream (sekali per buka halaman).
- UI: `src/components/admin/overview/*`; grafik `src/components/app-kit/bar-chart.tsx` (tanpa dependensi). Tiga bagian
  dimuat terpisah dengan `Suspense`. `overview-view.tsx` dan `shared/provider-health.ts` (data contoh) dihapus.
- Urutan halaman berubah dari §3: Peringatan ditaruh tepat di bawah angka utama (bukan paling bawah) supaya tidak
  terlewat; isinya tetap §3.5.
- Warna grafik: `app-accent` + token baru `app-chart-2` (`#2a78d6` terang / `#3987e5` gelap), divalidasi dengan skrip
  skill `dataviz` di kedua tema (semua cek lolos). Merah status (`app-danger`) tidak dipakai di grafik: di tema gelap
  gagal cek lightness (0,68 di luar 0,48–0,67). Grafik request: biru = berhasil atau berjalan, oranye = gagal, dengan
  legenda dan tabel untuk pembaca layar.
- Cakupan ditampilkan dibulatkan **ke bawah** (62,5% → 62%) agar tidak melebihkan.
- Diuji lewat HTTP dengan Surplus tiruan (16 cek; 2 temuan saat uji: cakupan dibulatkan ke atas, sudah diperbaiki;
  cek tautan terlalu luas di skrip uji). Tidak ada tautan di dalam isi halaman; dua tautan footer admin (Audit log,
  Pengaturan) memang bagian bingkai admin di semua halaman. Belum dilihat di browser.

## 10. Sumber

- Kode: `src/app/admin/(console)/page.tsx`, `src/components/admin/overview/{overview-view.tsx,overview-copy.ts}`,
  `src/components/admin/shared/provider-health.ts`, `src/components/dashboard/usage/cost-chart.tsx`,
  `src/lib/server/db/schema/{auth,admin,billing,gateway}.ts`, `src/lib/server/payments/{finance-report,exchange-rate,apply-webhook}.ts`,
  `src/lib/server/admin-gateway/upstream-health.ts`, `src/lib/server/admin-auth/audit.ts`.
- PRD: `gateway-pricing-billing.md` (§5, §8, §10, B7, B9), `admin-requests-upstream.md` (R4, R5), `backend-auth-admin.md` (A.7).
- DB lokal: hitungan baris (2026-11-12).
