# PRD: Admin Request log dan halaman Provider/Upstream (data nyata)

| | |
|---|---|
| Status | v3. R1–R4 diputuskan owner 2026-11-12 (§8) dan **dibangun** hari itu (§11). R5 dipindah ke `admin-overview.md`. Terbuka: R6. |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/admin/requests` (Request log) dan `/admin/providers` (Provider), termasuk perubahan pencatatan request yang dibutuhkan |
| Di luar cakupan | Halaman Ringkasan admin (masih memakai data contoh yang sama, `provider-health.ts`), rekonsiliasi biaya otomatis (butuh job, A6), ekspor CSV, notifikasi peringatan |
| Bergantung pada | `PRD/gateway-api.md` (§9, §13, §15a), `PRD/ai-gateway.md` (§4.2a, §4.5a, D5), `PRD/gateway-pricing-billing.md` (§10), `PRD/backend-auth-admin.md` (A.7) |

Setiap klaim tentang kode berasal dari berkas yang dibuka saat PRD ini ditulis (§10). Yang tidak bisa dibuktikan ditandai
**belum dibuktikan**; bagian **usulan** bisa diganti owner.

---

## 1. Kondisi saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Request log | **Mock penuh.** 10 baris contoh (email, model, status, latensi, token, biaya), filter Semua/Berhasil/Error di browser | `src/components/admin/requests/requests-data.ts`, `requests-view.tsx`; `src/app/admin/(console)/requests/page.tsx` tidak membaca DB |
| Provider | **Mock penuh.** 6 provider (Anthropic, OpenAI, Google, DeepSeek, Moonshot, xAI) dengan uptime, latensi p50, error, request 24 jam, tombol Aktifkan/Nonaktifkan yang hanya mengubah state browser; teks "request pindah ke model cadangan" | `src/components/admin/providers/*`, `src/components/admin/shared/provider-health.ts` |
| Pemakai data contoh provider yang sama | Ringkasan admin (`/admin`) | `src/components/admin/overview/overview-view.tsx` mengimpor `providerHealth` |
| Data request nyata | Tabel `gateway_requests` **sudah ada** dan diisi setiap request `/api/v1/chat/completions`: waktu, pengguna, key, model, endpoint, stream, state (`pending`/`succeeded`/`failed`), tahanan, tagihan ke pengguna, token input/output, id request Surplus, biaya Surplus (boleh kosong), status biaya (`known`/`pending`), status HTTP, kode error, latensi. Isi prompt/jawaban tidak disimpan | `src/lib/server/db/schema/gateway.ts`, `src/lib/server/gateway/request-billing.ts`, `upstream-outcome.ts` |
| Isi `gateway_requests` di DB lokal | 0 baris (data uji sudah dihapus) | query `count(*)`, 2026-11-12 |
| Kode error yang disimpan | Kode **nbytes** hasil pemetaan (`model_unavailable`, `service_unavailable`, ...), bukan kode asli Surplus. Jadi `no_sellers_for_model` dan `minimum_discount_not_met` tidak bisa dibedakan | `upstream-outcome.ts` (`errorCode: mapped.code`) |
| Header telemetri Surplus | `x-si-served-by`, `x-si-provider-family`, `x-si-attempts`, `x-si-truncated` **tidak disimpan**; hanya `x-request-id` dan `x-si-buyer-cost-micro` yang dibaca | `grep x-si- src/lib/server` |
| Peringatan admin | Hanya baris log server `[gateway] ADMIN ALERT` (kredit/key Surplus bermasalah); tidak ada tabel atau tampilan | `upstream-outcome.ts` |
| Saldo nbytes di Surplus | Endpoint `GET /v1/payments/balance` (`credit_balance_usdc`, string mikrodolar) terdokumentasi; **belum dipanggil kode** dan **belum pernah diuji** | `PRD/ai-gateway.md` §4.2a |

### 1.1 Mengapa halaman Provider tidak bisa dibuat seperti mockup

1. Surplus menyembunyikan identitas penjual; yang terlihat hanya `x-si-provider-family`, `x-si-served-by` dan
   `x-si-attempts` (`ai-gateway.md` §4.5a, §6 [S10]). Uptime dan latensi "per provider" versi mockup tidak tersedia
   langsung; paling dekat adalah dihitung sendiri dari request nbytes per family, dan itu pun belum dicatat.
2. Tombol "Nonaktifkan provider, request pindah ke model cadangan" tidak punya backend: nbytes tidak punya routing
   sendiri; routing dan failover dilakukan Surplus (`gateway-api.md` §7 butir 10). Field `providers_blocked` ada di
   Surplus, tetapi nbytes **membuangnya** dari request pengguna (A2) dan belum pernah memakainya sendiri. Apakah nbytes
   boleh memblokir penjual tertentu tanpa melanggar Terms §8 ("tidak boleh mematikan atau menyamarkan ... routing
   Surplus", `ai-gateway.md` §5 butir 4): **belum dibuktikan**.
3. Keputusan D5 di `ai-gateway.md` (pertahankan dengan data `x-si-*`, ganti "kesehatan upstream Surplus", atau tunda)
   masih terbuka.

## 2. Apakah kedua menu dibutuhkan

| Menu | Penilaian |
|---|---|
| Request log | **Dibutuhkan.** Satu-satunya tempat owner melihat request nyata: membantu pengguna yang komplain, melihat tagihan vs biaya Surplus (margin), menemukan request `cost_status = pending` yang perlu rekonsiliasi (billing §10), dan melihat error. Datanya sudah ada. |
| Provider | **Diganti, bukan dipertahankan** (R1 diputuskan, menutup D5): jadi halaman **Upstream** tentang Surplus sebagai satu-satunya upstream: saldo nbytes di Surplus, kesehatan per model dari request nbytes sendiri, dan error yang butuh tindakan owner. Tanpa tombol nonaktifkan provider (alasan §1.1 butir 2); menonaktifkan model sudah ada di Model & harga. |

## 3. Request log (`/admin/requests`)

### 3.1 Kolom (R2 diputuskan)

| Kolom | Sumber |
|---|---|
| Waktu (UTC) | `created_at` |
| Pengguna | `users.email` lewat `user_id` (akun terhapus → "akun dihapus") |
| Key | `api_keys.name` + `key_prefix` lewat `api_key_id` (key terhapus → "—") |
| Model | `model_id`, plus penanda "stream" bila `stream` |
| Status | state + `status_code` + kode error nbytes; badge titik + kata (Berhasil / Gagal / Berjalan) |
| Latensi | `latency_ms` |
| Token | `input_tokens` · `output_tokens` dalam dua kolom terpisah |
| Tagihan | `charge_micros` (ke pengguna) |
| Biaya Surplus | `surplus_cost_micros`; kosong → "menunggu" (`cost_status = pending`), **tidak pernah** ditulis 0 |
| Margin | tagihan − biaya Surplus, hanya bila biaya diketahui; negatif diberi tanda (billing §10 butir 3) |

### 3.2 Saring, cari, halaman

- Saring status (`?status=all|succeeded|failed|pending`), saring biaya menunggu (`?cost=pending`), cari email pengguna
  atau id model (`?q=`). Semuanya di URL, diproses server.
- 50 baris per halaman, terbaru dulu, memakai `app-kit/pagination.tsx` yang sudah ada.
- Indeks yang sudah ada: `created_at`, `user_id`, (`api_key_id`, `created_at`). Saring status dan biaya pada tabel
  besar butuh indeks tambahan (usulan: `(state, created_at)`, indeks parsial `cost_status = 'pending'`).

### 3.3 Detail per request (usulan, ringan)

Baris bisa dibuka untuk melihat: id request nbytes (yang dilihat pengguna di header `x-request-id`), id request Surplus,
endpoint, tahanan, kode error. Tanpa isi prompt (memang tidak disimpan).

## 4. Upstream (`/admin/providers` diganti nama; R1 diputuskan)

| Bagian | Isi | Sumber | Status data |
|---|---|---|---|
| Saldo Surplus | Saldo kredit nbytes di Surplus, waktu dibaca | `GET /v1/payments/balance` dengan key nbytes, dibaca saat halaman dibuka | **Belum pernah diuji**; butuh izin owner untuk dipanggil |
| Kesehatan per model (24 jam) | Per model aktif: jumlah request, % gagal, latensi p50, jumlah "model tidak tersedia", biaya menunggu | Agregat `gateway_requests` | Ada; perlu kode error asli Surplus (§5) untuk membedakan "tidak ada penjual" dari "lantai diskon tidak terpenuhi" |
| Kejadian yang butuh tindakan | Request gagal karena key/kredit Surplus bermasalah (dulu hanya log `ADMIN ALERT`), margin negatif | `gateway_requests` (kode error + kode asli Surplus) | Ada setelah §5 |
| Family penyaji (opsional) | Sebaran `x-si-provider-family` per model | Kolom baru (§5) | Belum dicatat |

Tidak ada tombol mengubah routing di halaman ini.

## 5. Perubahan pencatatan request (R3 diputuskan)

Kolom baru di `gateway_requests` (nullable, migrasi aditif):

| Kolom | Isi | Untuk |
|---|---|---|
| `upstream_error_code` | `code` asli dari envelope error Surplus | Membedakan `no_sellers_for_model`, `minimum_discount_not_met`, `insufficient_credit`, dll. di Upstream |
| `upstream_family` | `x-si-provider-family` | Sebaran family (opsional) |
| `truncated` | `x-si-truncated: 1` → true | Jawaban terpotong deadline (`ai-gateway.md` §4.4) |

Nilai header ini dibuat Surplus; disimpan maks 100 karakter dan tidak pernah dikirim ke pengguna (`gateway-api.md` §9).

## 6. Berkas (usulan, sesuai `architecture.md`)

| Isi | Lokasi |
|---|---|
| Query | `src/lib/server/gateway/request-log.ts`, `src/lib/server/gateway/upstream-health.ts` |
| Saldo Surplus | fungsi baru di `src/lib/server/gateway/surplus-client.ts` |
| Kontrak (filter, halaman, DTO) | `src/lib/gateway/request-log-contract.ts` (folder `lib/gateway` saat ini 10 berkas: perlu dikelompokkan dulu, aturan ~10 berkas per folder) |
| UI | `src/components/admin/requests/*`, `src/components/admin/providers/*` → diganti nama `upstream/` bila D5 disetujui; `requests-data.ts` dihapus; `shared/provider-health.ts` dihapus setelah Ringkasan juga tidak memakainya |

## 7. Keamanan dan privasi

- Halaman memanggil `getCurrentAdmin()` di samping data; tidak ada endpoint yang mengubah data di PRD ini.
- Tidak menampilkan key penuh, hash key, atau isi prompt (memang tidak disimpan).
- Panggilan saldo Surplus memakai key nbytes di server saja; nilainya tidak pernah ke klien selain angka saldo.

## 8. Keputusan yang dibutuhkan

| # | Pertanyaan | Usulan |
|---|---|---|
| R1 | Halaman Provider: ganti jadi "Upstream" (Surplus), hapus menunya, atau tunda? (= D5) | **Diputuskan:** ganti jadi Upstream (menutup D5 di `ai-gateway.md`) |
| R2 | Request log menampilkan biaya Surplus dan margin per request? | **Diputuskan:** ya |
| R3 | Simpan kode error asli Surplus, `x-si-provider-family`, dan tanda terpotong (§5)? | **Diputuskan:** ya |
| R4 | Halaman Upstream memanggil `GET /v1/payments/balance` ke Surplus asli setiap dibuka? (panggilan Surplus sungguhan, tanpa biaya inferensi; belum pernah diuji) | **Diputuskan:** boleh; diuji sekali ke Surplus asli sebelum dipakai |
| R5 | Halaman Ringkasan admin ikut memakai data nyata yang sama? | **Dipindah** ke `PRD/admin-overview.md` (2026-11-12) |
| R6 | Retensi `gateway_requests` | **Terbuka.** Belum ada angka |

## 9. Kriteria selesai

- Tidak ada `requests-data.ts`; halaman Provider tidak lagi menampilkan angka contoh atau tombol yang tidak berfungsi.
- Request log menampilkan baris nyata dari `gateway_requests`, biaya kosong tampil "menunggu", bukan $0.
- `npx tsc --noEmit`, `npm run lint`, test lolos; diuji lewat HTTP di DB lokal dengan Surplus tiruan; data uji dihapus.

## 11. Status pembangunan (2026-11-12)

- `GET /v1/payments/balance` diuji sekali ke Surplus asli (izin R4): HTTP 200; semua field `*_usdc` berupa string
  angka; dipakai `credit_balance_usdc`, `auto_topup_enabled`, `account_status`. Field saldo ditahan (`fiat_held_usdc`,
  `usdc_held_usdc`) tidak ditampilkan karena artinya untuk nbytes tidak terdokumentasi.
- Migrasi `drizzle/0010_cloudy_molly_hayes.sql`: kolom `upstream_error_code`, `upstream_family`, `truncated`; indeks
  `(state, created_at)` dan indeks parsial `cost_status = 'pending'`. Diisi oleh `upstream-outcome.ts` (`readTelemetry`).
  Pada jawaban panjang yang memindahkan header ke objek body `surplus` [S6], family dan tanda terpotong **tidak** terbaca
  (nama field di objek itu tidak terdokumentasi).
- Request log: `src/lib/server/admin-gateway/request-log.ts`, kontrak `src/lib/admin-gateway/request-log-contract.ts`
  (+ test), UI `src/components/admin/requests/*`. Pencarian juga menerima id request nbytes (`x-request-id`).
- Upstream: rute `/admin/providers` diganti `/admin/upstream`, menu "Upstream"; `src/lib/server/admin-gateway/upstream-health.ts`,
  `src/components/admin/upstream/*`. `src/components/admin/providers/` dan `requests-data.ts` dihapus.
- `src/lib/server/gateway/` sudah 12 berkas: bagian admin dipindah ke `src/lib/server/admin-gateway/` (termasuk
  `catalog-admin.ts`); `gateway/` kini 11 berkas.
- `app-kit/list-skeleton.tsx` baru menggantikan kerangka muat halaman Pengguna dan Audit log (salinan ketiga).
- Belum diubah: halaman Ringkasan masih memakai `shared/provider-health.ts` (data contoh; R5), dan tautan "lihat semua"
  di sana kini ke `/admin/upstream`. Tabel menu di `backend-auth-admin.md` A.7 masih menyebut "Provider".
- Diuji lewat HTTP dengan Surplus tiruan (20 cek baru + 28 cek gateway lama, semua lolos). Belum dilihat di browser.

## 10. Sumber

- Kode: `src/components/admin/requests/*`, `src/components/admin/providers/*`, `src/components/admin/shared/provider-health.ts`,
  `src/components/admin/overview/overview-view.tsx`, `src/app/admin/(console)/{requests,providers}/page.tsx`,
  `src/lib/server/db/schema/gateway.ts`, `src/lib/server/gateway/{request-billing,upstream-outcome,chat-completions}.ts`.
- PRD: `ai-gateway.md` (§4.2a, §4.4, §4.5a, §5, §6, D5), `gateway-api.md` (§7, §9, §13, §15a), `gateway-pricing-billing.md`
  (§10), `backend-auth-admin.md` (A.7).
- DB lokal: `count(*)` `gateway_requests` (2026-11-12).
