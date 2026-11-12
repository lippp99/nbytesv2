# PRD: API Gateway nbytes (endpoint publik, key API, error, streaming)

| | |
|---|---|
| Status | Draft v3. A1–A5 disetujui (2026-11-11). Fase 1 + chat completions **dibangun** 2026-11-12, diuji hanya dengan Surplus tiruan (§15a). Terbuka: A6 (hosting), D9, domain, D7, D10. |
| Tanggal | 2026-11-11 |
| Repo | `nbytesv2` (branch `develop`), Next 16.4.5 dengan `cacheComponents: true` |
| Induk | `PRD/ai-gateway.md` (fakta Surplus, sumber S1–S32), `PRD/gateway-pricing-billing.md` (harga, saldo, deposit, P1–P15) |
| Cakupan | Base URL dan path, key API pengguna, endpoint publik dan internal, alur per request, validasi, streaming, pemetaan error, rate limit, webhook Sumopod, keamanan |
| Di luar cakupan | Skema DB final dan migrasi, UI |

Fakta Surplus merujuk ke `ai-gateway.md` §12 ([S..]), fakta Sumopod ke `gateway-pricing-billing.md` §15 ([P..]),
fakta Next.js ke docs terpasang ([N..], §16). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**; bagian
**usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Tujuan

1. Pengguna memakai SDK OpenAI atau Anthropic biasa: cukup ganti base URL dan key ke milik nbytes.
2. Setiap request diautentikasi, divalidasi, dibatasi, ditagih ke saldo, dan tercatat, sebelum dan sesudah Surplus.
3. Key Surplus, secret Sumopod, dan detail upstream tidak pernah sampai ke pengguna.

## 2. Keputusan yang dipakai

| # | Keputusan | Sumber |
|---|---|---|
| D1 | Pola B: nbytes memegang pengguna, key, saldo; Surplus dipanggil dengan key nbytes | `ai-gateway.md` §8 |
| D3 | Cakupan lengkap: endpoint di `ai-gateway.md` §4.2, urutan §8.1 | `ai-gateway.md` §8 |
| D4 | Model dikurasi admin; model di luar daftar ditolak | `ai-gateway.md` §8 |
| D2/D2a/D2b | Harga jual tetap = harga list, lantai diskon 25 pada key Surplus | `ai-gateway.md` §6.1 |
| D6, B1–B9 | Saldo USD, deposit IDR lewat Sumopod QRIS | `gateway-pricing-billing.md` |
| D9 | `/v1/decisions` dan Provider Market `/v1/resources/*` **belum** masuk (masih terbuka) | `ai-gateway.md` §8 |

## 3. Kondisi kode saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Halaman API Keys | Mock: nama key maks 40 karakter, batas bulanan USD opsional ("request ditolak setelah batas tercapai"), key penuh hanya tampil sekali, cabut, terakhir dipakai, pemakaian bulan ini; contoh env `NBYTES_API_KEY` | `src/components/dashboard/api-keys/*` |
| Base URL di UI | Mock `BASE_URL = "https://api.example.com/v1"`, dipakai di Docs, Playground, Quick Start | `src/lib/model-catalog.ts`, `grep BASE_URL` |
| Pola route handler | Parse → `lib/server` → respons; error lewat `AppError` (kode auth saja) | `src/app/api/auth/otp/request/route.ts`, `src/lib/server/errors.ts` |
| Penjaga request auth | `readGuardedJson`: wajib Origin sama, JSON, body ≤ 1 KB | `src/lib/server/auth/request-guard.ts` |
| Kripto dan rate limit | `randomToken` (32 byte base64url), `hmac`, `sha256`, `equalHex`; rate limit berbasis DB (`hit`, `enforceLimit`) | `src/lib/server/auth/crypto.ts`, `rate-limit.ts` |
| Proxy Next | Hanya halaman dashboard; tidak mencakup `/api/*` | `src/proxy.ts` |
| Validasi | Tanpa `zod`; kontrak ditulis tangan di `*-contract.ts` | `PRD/backend-auth-user.md` (stack) |
| Hosting dan job berkala | **Belum diputuskan** | `PRD/backend-auth-user.md` §7.3, §9.6 |

`readGuardedJson` **tidak boleh** dipakai untuk API publik: cek Origin akan menolak semua klien SDK. API publik butuh
penjaga sendiri (§7). Endpoint dashboard tetap memakainya.

## 4. Base URL dan path

Aturan proyek: endpoint HTTP di `src/app/api/<domain>/.../route.ts` (`.claude/rules/architecture.md`). **Usulan:**

| Permukaan | Base URL untuk pengguna | Folder route |
|---|---|---|
| OpenAI-compatible | `https://<domain-nbytes>/api/v1` | `src/app/api/v1/...` |
| Anthropic-compatible | `https://<domain-nbytes>/api/anthropic` (SDK menambahkan `/v1/messages`) | `src/app/api/anthropic/v1/...` |

Domain produksi **belum diputuskan** (A1). Subdomain khusus (mis. `api.<domain>`) bisa ditambah kemudian lewat
rewrite tanpa memindah route. Setelah diputuskan, `BASE_URL` mock di UI diganti.

## 5. Key API pengguna

| Hal | Aturan |
|---|---|
| Format | **Usulan:** awalan `nbk_` + `randomToken()` (32 byte acak, base64url). Awalan membantu pemindai rahasia dan pengguna mengenali key. |
| Penyimpanan | Hanya hash: `hmac(API_KEY_HASH_SECRET, key)`. Key penuh ditampilkan **sekali** saat dibuat, tidak bisa dilihat lagi (sesuai mock). Disimpan juga awalan pendek untuk tampilan (mis. `nbk_ab12…`). |
| Header | `/api/v1`: `Authorization: Bearer <key>`. `/api/anthropic`: `x-api-key: <key>` atau `Authorization: Bearer <key>` (cara SDK Anthropic dan Claude Code [S4]). |
| Atribut | nama (maks 40), batas bulanan USD opsional dengan berhenti keras, `last_used_at`, `revoked_at`, dibuat oleh. |
| Batas jumlah | **Usulan:** 20 key aktif per pengguna (A4). |
| Ditolak bila | key tidak dikenal/dicabut → 401; akun `suspended` → 403; batas bulanan key habis → 402 `key_budget_exceeded`. |
| Hapus akun | Semua key dicabut dalam transaksi yang sama. |
| Log | Key tidak pernah ditulis ke log, termasuk awalannya di log error. |

`last_used_at` ditulis paling sering sekali per menit per key (usulan) agar tidak menambah satu tulis DB per request.

## 6. Endpoint publik (dipanggil pengguna dengan key API)

Semua endpoint inferensi: autentikasi key → alur §7 → Surplus dengan key nbytes. Fase mengikuti `ai-gateway.md` §8.1.

| Endpoint nbytes | Ke Surplus | Fase | Catatan |
|---|---|---|---|
| `GET /api/v1/models`, `GET /api/v1/models/{id}` | tidak (dari DB katalog dikurasi) | 1 | Bentuk mengikuti OpenAI `{ data: [...] }`, harga = harga jual nbytes, bukan harga Surplus |
| `POST /api/v1/chat/completions` | `/v1/chat/completions` | 2 | Streaming SSE |
| `POST /api/v1/completions` | `/v1/completions` | 2 | |
| `POST /api/v1/responses` | `/v1/responses` | 2 | Hosted tools dan `previous_response_id` tidak didukung Surplus [S17] |
| `POST /api/anthropic/v1/messages` | `/anthropic/v1/messages` | 3 | Envelope error Anthropic |
| `POST /api/anthropic/v1/messages/count_tokens` | `/anthropic/v1/messages/count_tokens` | 3 | Gratis, hanya estimasi [S4]; tetap kena rate limit |
| `GET /api/anthropic/v1/models` | tidak (dari DB) | 3 | Bentuk Anthropic, isi = katalog dikurasi |
| `POST /api/v1/embeddings` | `/v1/embeddings` | 4 | Tanpa lantai diskon [S26] |
| `POST /api/v1/images/generations`, `/images/edits` | sama | 4 | Edit: JSON atau `multipart/form-data` (maks 8 MiB per gambar), maks 8 gambar [S23, S25] |
| `POST /api/v1/audio/speech` | sama | 4 | Respons byte audio, bukan JSON |
| `POST /api/v1/audio/transcriptions` | sama | 4 | `multipart/form-data`, maks 25 MB [S25] |
| `POST /api/v1/video/generations`, `GET`/`DELETE …/{id}` | sama | 5 | Id job nbytes sendiri, dipetakan ke id Surplus |
| `POST /api/v1/music/generations`, `GET`/`DELETE …/{id}` | sama | 5 | idem |
| `GET /api/v1/media/artifacts/{jobId}/{index}` | `/v1/media/artifacts/...` | 5 | nbytes meneruskan unduhan dengan key nbytes; pengguna tidak pernah menerima `job_token` Surplus |

Tidak diteruskan ke pengguna: endpoint akun Surplus, `/v1/prices`, `/api/markets`, `/v1/decisions` dan
`/v1/resources/*` (D9).

**ID model.** Pengguna memakai id kanonik Surplus yang dikurasi admin (mis. `claude-opus-4.6`). Hanya id yang **persis**
ada di katalog aktif yang diterima; alias Surplus (`anthropic/…`, `-latest`, nama Venice [S22, S4]) ditolak
`404 model_not_found`, agar alias tidak bisa melewati kurasi atau harga.

## 7. Alur per request inferensi

1. **Penjaga awal:** metode dan `Content-Type` sesuai endpoint; ukuran body ≤ 10 MB (JSON), 25 MB (transkripsi), atau
   8 MiB per gambar (edit multipart), sama dengan batas Surplus [S25]. Lebih → `413`.
2. **Autentikasi** key (§5) → pengguna aktif.
3. **Rate limit** per key (§10).
4. **Validasi** di `src/lib/gateway/*-contract.ts` (kontrak tulis tangan, satu per permukaan): `model` string ada di
   katalog aktif; field wajib per endpoint ada dengan tipe benar (`messages` array, `max_tokens` integer positif bila
   ada, `stream` boolean, `n`/`size` untuk gambar); field lain diteruskan apa adanya (Surplus memakai deny-list yang
   sama [S11]).
5. **Field routing Surplus dibuang** dari body: `provider`, `provider_url`, `provider_base_url`, `providers_blocked`,
   `provider_order`, `si_route`, `min_discount_pct`; header `X-Min-Discount`, `X-SI-*` dari pengguna juga dibuang
   (usulan, A2). Alasan: routing dan biaya dikendalikan nbytes; objektif non-harga menaikkan tahanan biaya [S10].
6. **Kapabilitas** (usulan, murah): gambar ke model tanpa dukungan gambar ditolak `400` sebelum memanggil Surplus
   (cek `input_modalities` **atau** `supported_features` dari katalog [S5]).
7. **Tahan saldo** sesuai `gateway-pricing-billing.md` §9. Kurang → `402 insufficient_balance`.
8. **Panggil Surplus** dengan key nbytes, `stream_options.include_usage = true` untuk streaming, dan
   `X-Min-Discount: 25` (cadangan bila setelan key tidak terbaca; yang paling ketat yang berlaku [S26]).
9. **Selesaikan:** baca hasil (non-streaming: periksa body `error`/`choices`, bukan status saja [S6]), potong tagihan,
   lepas sisa tahanan, simpan baris request (`gateway-pricing-billing.md` §10), balas pengguna.
10. **Tidak mengulang otomatis** request inferensi yang gagal tidak jelas (tagihan ganda [S18]); failover sudah di
    Surplus [S8].

Route handler POST tidak di-cache [N1]. Route GET (`/models`) memakai data DB per request; bila nanti di-cache, lewat
helper `use cache` sesuai aturan Cache Components [N1].

## 8. Streaming

- Route handler mengembalikan `ReadableStream` (Web API) [N2]. Byte SSE dari Surplus diteruskan apa adanya ke
  pengguna, sambil dibaca untuk mengambil event usage terakhir (`usage.prompt_tokens`, `completion_tokens`,
  `buyer_cost_micro`) [S8].
- Komentar SSE (`: ping`, `: si-secrets-withheld`) diteruskan; parser SSE standar mengabaikannya [S10].
- Pengguna memutus koneksi → request ke Surplus dibatalkan. Apakah Surplus tetap menagih token yang sudah dibuat:
  **belum dibuktikan**; tagihan dicatat dari usage bila ada, kalau tidak dari rekonsiliasi.
- Tidak ada usage di akhir → potong sebesar tahanan sementara, tandai `cost_pending`, koreksi saat rekonsiliasi
  (`gateway-pricing-billing.md` §9 butir 5).
- Request non-streaming yang lama: nbytes menunggu body lengkap dari Surplus lalu membalas dengan status yang benar.
  Batas waktu eksekusi route (`maxDuration`) ditetapkan platform hosting [N3], yang **belum diputuskan** (A6).

## 9. Error

**Envelope.** `/api/v1/*`: `{"error": {"type", "code", "message", "param"}}`, meniru OpenAI agar SDK membacanya.
`/api/anthropic/*`: `{"type": "error", "error": {"type", "message"}}`, meniru Anthropic [S4]. Setiap respons membawa
header `x-request-id` milik nbytes. Pesan ke pengguna umum; detail upstream hanya di log server.

**Error dari nbytes sendiri**

| Status | `code` | Kapan |
|---|---|---|
| 400 | `invalid_request` | Validasi gagal (`param` menyebut field) |
| 401 | `invalid_api_key` | Key tidak ada, salah, dicabut |
| 402 | `insufficient_balance` | Saldo tersedia < tahanan (di `/api/anthropic`: 400 `invalid_request_error`, seperti Anthropic [S4]) |
| 402 | `key_budget_exceeded` | Batas bulanan key tercapai |
| 403 | `account_suspended` | Akun ditangguhkan |
| 404 | `model_not_found` | Model tidak ada di katalog aktif |
| 413 | `request_too_large` | Body melewati batas |
| 429 | `rate_limited` | Rate limit nbytes, dengan `Retry-After` |

**Pemetaan error Surplus** (dibaca dari `code` [S2]):

| Dari Surplus | Ke pengguna | Tindakan nbytes |
|---|---|---|
| 400 (request/provider menolak) | 400 `invalid_request`, `param` diteruskan bila ada | – |
| 401/403 (key nbytes bermasalah) | 503 `service_unavailable` | Peringatan admin segera |
| 402 `insufficient_credit` / `budget_exceeded` (saldo nbytes di Surplus) | 503 `service_unavailable` | Peringatan admin segera; bukan salah pengguna |
| 404 `no_sellers_for_model`, `minimum_discount_not_met` | 503 `model_unavailable` | Dihitung per model untuk admin |
| 429 | 429 `rate_limited` + `Retry-After` | Peringatan admin bila sering (batas gabungan nbytes) |
| 503 `no_healthy_sellers`, `route_deadline_exceeded` | 503 `model_unavailable` | – |
| 5xx lain / jaringan | 502 `upstream_error` | – |
| HTTP 200 berisi `error` (request panjang [S6]) | sesuai `code` di atas | Tidak ditagih (`gateway-pricing-billing.md` §7.4) |

Header `x-si-*` Surplus tidak diteruskan ke pengguna; disimpan di baris request untuk admin (usulan).

## 10. Rate limit

- Batas Surplus berlaku untuk **seluruh** trafik nbytes: ±1.200 request/menit per key Surplus dan 6.000 per 5 menit per
  IP keluar [S8]. Tanpa batas per pengguna, satu pengguna bisa menghabiskan kapasitas semua pengguna.
- **Usulan (A3):** 120 request/menit per key nbytes, bisa diubah admin per pengguna; memakai mekanisme DB yang sudah ada
  (`hit`/`enforceLimit`). Docs Next juga menyarankan rate limit dari hosting bila tersedia [N4].
- Melebihi → `429 rate_limited` dengan `Retry-After`.

## 11. Endpoint internal

**Dashboard pengguna** (sesi login, `readGuardedJson`/cek Origin, kontrak di `src/lib/*-contract.ts`):

| Endpoint | Fungsi |
|---|---|
| `POST /api/keys`, `DELETE /api/keys/{id}` | Buat key (balas key penuh sekali), cabut key |
| `POST /api/payments/deposits` | Buat permintaan deposit + pembayaran Sumopod, balas `payment_link_url` (`gateway-pricing-billing.md` §6) |
| `POST /api/playground/chat` | **Usulan (A5):** Playground memakai sesi login, bukan key API, dan menagih saldo pengguna lewat alur §7 |

Halaman (daftar key, saldo, riwayat) membaca data langsung di Server Component lewat `lib/server`, tanpa endpoint.

**Webhook:** `POST /api/payments/sumopod/webhook` (domain `payments`). Tanpa sesi dan tanpa cek Origin; diautentikasi
hanya dengan tanda tangan svix (`gateway-pricing-billing.md` §6.3). Body dibaca sekali sebagai teks mentah
(`request.text()`, body hanya bisa dibaca sekali [N5]) lalu baru di-parse. Membalas 2xx dalam 10 detik [P8]:
pekerjaan berat tidak dilakukan di sini.

**Admin** (sinkron katalog, harga jual, kurs, deposit tertunda, rekonsiliasi): bergantung pada backend login admin
yang **belum ada** (`PRD/backend-auth-admin.md` belum dibangun; `src/lib/admin-auth/admin-auth-client.ts` masih mock
tanpa server). Endpoint admin baru dibangun setelah itu.

**Job berkala** (sinkron katalog harian, rekonsiliasi biaya, pemeriksaan buku saldo, polling job video/musik):
mekanismenya tergantung hosting, **belum diputuskan** (A6), sama seperti job pembersihan di `PRD/backend-auth-user.md`.

## 12. Keamanan

- Secret hanya di env server, nama dicatat di `.env.example` tanpa nilai (usulan nama): `SURPLUS_API_KEY`,
  `SURPLUS_BASE_URL`, `SUMOPOD_API_KEY`, `SUMOPOD_API_BASE_URL`, `SUMOPOD_WEBHOOK_SECRET`, `API_KEY_HASH_SECRET`.
  Sandbox dan Live memakai nilai berbeda [P5].
- Modul yang memegang secret dimulai `import "server-only"`.
- **Tidak ada CORS** di `/api/v1` dan `/api/anthropic`: key harus dipakai dari server, sesuai teks halaman API Keys.
- Isi prompt dan jawaban **tidak disimpan** nbytes (usulan); yang disimpan: metadata, token, biaya, status. Sejalan
  dengan Surplus [S13] dan mengurangi risiko data pribadi.
- Log tidak memuat key, secret, isi prompt, atau body webhook utuh.
- Error tak terduga → 500/503 dengan pesan umum, detail di log server (aturan proyek).

## 13. Model data tambahan (usulan; tabel lain di `gateway-pricing-billing.md` §12)

| Tabel | Isi utama |
|---|---|
| `api_keys` | `user_id`, `name`, `key_hash` (unik), `key_prefix`, `monthly_budget_micros` (nullable), `last_used_at`, `revoked_at`, `created_at` |
| `media_jobs` | id nbytes, `user_id`, id job Surplus, `kind` (`video`/`music`), status, tahanan, `created_at` |

`gateway_requests` (billing PRD) ditambah `api_key_id`, `endpoint`, `stream`, `status_code`, `error_code`, latensi.

## 14. Keputusan terbuka

A1–A5 disetujui owner 2026-11-11 ("setuju semua").

| # | Pertanyaan | Keputusan / usulan |
|---|---|---|
| A1 | Path base URL | **Diputuskan:** `/api/v1` dan `/api/anthropic` (§4). Nama domain produksinya sendiri belum disebut owner. |
| A2 | Buang field routing Surplus dari request pengguna? | **Diputuskan:** ya (§7 butir 5) |
| A3 | Rate limit default per key | **Diputuskan:** 120 request/menit, bisa diubah admin |
| A4 | Maksimal key aktif per pengguna | **Diputuskan:** 20 |
| A5 | Playground lewat sesi login dan menagih saldo? | **Diputuskan:** ya |
| A6 | Hosting (menentukan `maxDuration`, IP keluar untuk batas Surplus, mekanisme job berkala) | Belum ada; keputusan owner |
| D9 | `/v1/decisions` dan Provider Market ikut? | Ditunda (`ai-gateway.md` §8) |

## 15. Belum dibuktikan

- Apakah Surplus tetap menagih bila pengguna memutus stream di tengah.
- Bentuk request/respons embeddings dan audio di Surplus (tanpa halaman referensi [S19]).
- Apakah `X-Min-Discount` di header berlaku bersamaan dengan setelan key (docs: yang paling ketat berlaku [S26]; belum diuji).
- Semuanya diuji setelah nbytes punya key Surplus (`ai-gateway.md` D10).

## 15a. Status pembangunan (2026-11-12)

Cakupan dipilih owner 2026-11-12: "Fondasi + chat". Keputusan owner hari itu: estimasi token input untuk tahanan =
byte body JSON ÷ 4 (dibulatkan ke atas) (menutup `gateway-pricing-billing.md` §9 butir 1); model masuk katalog lewat
endpoint admin, UI admin menyusul; katalog publik Surplus boleh dibaca sekali untuk mencocokkan bentuk data.

| Dibangun | Berkas |
|---|---|
| Tabel `api_keys`, `model_prices`, `gateway_requests`; `balance_ledger.request_id` | `src/lib/server/db/schema/gateway.ts`, `billing.ts`, `drizzle/0008_quiet_junta.sql` |
| `POST /api/keys`, `DELETE /api/keys/{id}` (sesi, Origin; maks 20 key aktif) | `src/app/api/keys/`, `src/lib/server/gateway/api-keys.ts` |
| `POST /api/admin/models` (sesi admin; harga list dibaca dari katalog Surplus, harga jual = list × (1 + markup) dibulatkan ke atas ke mikrodolar; audit `model_price_set`) | `src/app/api/admin/models/`, `src/lib/server/gateway/catalog.ts` |
| `GET /api/v1/models`, `GET /api/v1/models/{id}` (wajib key; harga jual dalam bentuk `pricing.prompt`/`completion` USD per token seperti katalog Surplus) | `src/app/api/v1/models/` |
| `POST /api/v1/chat/completions` (+ streaming), alur §7 langkah 1–10, error §9, rate limit 120/menit per key | `src/app/api/v1/chat/completions/`, `src/lib/server/gateway/*` |
| Kontrak dan hitungan murni + test | `src/lib/gateway/*` |

Fakta yang terbukti 2026-11-12 (`GET https://api.surplusintelligence.ai/v1/models` tanpa key, 527 model): harga
`pricing.prompt`/`completion` berupa string desimal USD per token, maksimal 10 desimal; `input_cache_read`/`write`
ada di 281 model; `top_provider.max_completion_tokens` ada di semua model; `claude-opus-4.6` punya
`input_modalities: ["text"]` tetapi `supported_features` memuat `vision` (dua sumber memang bisa tidak cocok [S5]).

Keputusan teknis saat membangun (bisa diganti owner):
- Biaya Surplus (`usage.buyer_cost_micro` dan setiap field `usage` berisi "cost") serta objek `surplus` dibuang dari
  respons, juga dari event usage di stream; event lain diteruskan apa adanya (§1.3 lebih diutamakan dari §8 "apa adanya").
- Token cache belum dihitung terpisah (nama field belum terbukti); ikut tarif input.
- Pengguna putus di tengah stream → tahanan dipotong penuh, `cost_status = pending`, `error_code = client_disconnected`
  (§8). Koreksinya menunggu job rekonsiliasi (A6).
- Pesan error API dalam bahasa Inggris (dibaca SDK).
- Rate limit per key belum bisa diubah admin per pengguna (A3 bagian kedua belum dibangun).

Tambahan 2026-11-12 (owner: "hubungkan"): halaman admin `/admin/models` memakai data nyata. Isinya model di nbytes
(dari `model_prices`: markup, aktif/nonaktif, tanda "harga list berubah" dan "tidak ada di katalog") dan katalog
Surplus yang dibaca langsung (model teks saja, cari dan saring, tombol Tambah dengan markup 0%). Data contoh lama
(aturan margin, biaya upstream karangan, contoh hitungan, biaya top-up 5%) dihapus. Menonaktifkan model tidak butuh
Surplus. Model dengan harga list 0 di katalog (63 model teks pada 2026-11-12) **ditolak** (409 `blocked`) karena
belum diketahui apakah Surplus tetap menagih nbytes. Markup di UI 0–300% (server menerima −99,99% s.d. 300%).

Belum dibangun: `/completions`, `/responses`, permukaan Anthropic, media, Playground (A5), UI key API,
rekonsiliasi dan pelepasan tahanan yang macet (butuh job, A6), peringatan admin selain log server, pengumuman
perubahan harga ke pengguna.

## 16. Sumber

- `PRD/ai-gateway.md` (S1–S32), `PRD/gateway-pricing-billing.md` (P1–P15), `PRD/backend-auth-user.md`,
  `PRD/backend-auth-admin.md`, `.claude/rules/architecture.md`, `.claude/rules/backend-security.md`.
- Kode: `src/components/dashboard/api-keys/api-keys-copy.ts`, `api-keys-view.tsx`, `src/lib/model-catalog.ts`,
  `src/app/api/auth/otp/request/route.ts`, `src/lib/server/errors.ts`, `src/lib/server/auth/request-guard.ts`,
  `crypto.ts`, `rate-limit.ts`, `src/proxy.ts`, `next.config.ts`.
- Docs Next.js 16.4.5 terpasang (`node_modules/next/dist/docs/01-app/`):

| Kode | Berkas | Isi yang dipakai |
|---|---|---|
| N1 | `01-getting-started/15-route-handlers.md` | Metode selain GET tidak di-cache; GET dengan Cache Components berjalan per request bila membaca data runtime, `use cache` lewat helper |
| N2 | `03-api-reference/03-file-conventions/route.md` (Streaming) | Streaming respons dengan `ReadableStream` |
| N3 | `03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` | `maxDuration` dipakai platform deployment |
| N4 | `02-guides/backend-for-frontend.md` | Saran rate limit dari hosting (dikutip juga di `PRD/backend-auth-user.md` §7) |
| N5 | `02-guides/backend-for-frontend.md` | Body request hanya bisa dibaca sekali |
