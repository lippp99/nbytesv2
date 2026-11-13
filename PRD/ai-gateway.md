# PRD: Backend AI Gateway (upstream Surplus Intelligence)

| | |
|---|---|
| Status | Draft v1: D1, D2, D3, D4, D6 diputuskan owner (2026-11-11). **Belum siap dibangun** sampai sisa §8 diputuskan. |
| Tanggal | 2026-11-11 |
| Repo | `nbytesv2` (branch `develop`) |
| Upstream | Surplus Intelligence, docs `https://www.surplusintelligence.ai/docs` (dibaca 2026-11-11) |
| Cakupan dokumen ini | Fakta upstream yang memengaruhi desain, kondisi kode saat ini, keputusan owner, risiko |
| Di luar cakupan | Skema DB final, kontrak API final, UI (menyusul setelah §8 diputuskan) |

Setiap fakta upstream diberi sumber (§12). Yang tidak tertulis di docs ditandai **tidak terdokumentasi**; yang
belum dicek ditandai **belum dibuktikan**. Docs Surplus bisa berubah: cek ulang changelog sebelum membangun.

---

## 1. Tujuan

1. Pengguna nbytes memanggil satu API (base URL nbytes, API key nbytes) dan mendapat jawaban model AI.
2. nbytes meneruskan request ke Surplus, mencatat pemakaian dan biaya aktual per request, lalu memotong saldo pengguna
   dengan harga jual nbytes.
3. Admin melihat biaya upstream, pendapatan dan kesehatan upstream dari data nyata, bukan mock.

## 2. Kondisi kode saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Backend gateway | Belum ada. `src/lib/server/` hanya berisi `account/`, `auth/`, `db/`, `errors.ts` | `ls src/lib/server` |
| Skema DB | Hanya domain auth | `src/lib/server/db/schema/auth.ts` |
| Route API | Hanya `api/account/*` dan `api/auth/*` | `ls src/app/api` |
| Katalog model | Mock, `BASE_URL = "https://api.example.com/v1"`, harga integer mikrodolar per 1M token | `src/lib/model-catalog.ts` |
| Biaya upstream (admin) | Mock per model, tetap per 1M token | `src/components/admin/models/models-data.ts` |
| Rumus margin | `applyMarkup`: harga jual = biaya × (1 + markup), dibulatkan ke atas ke sen | `src/components/admin/models/margin-math.ts`, PRD `backend-auth-admin.md` Lampiran A.8 |
| Kesehatan provider (admin) | Mock per provider (OpenAI, Anthropic, ...) | `src/components/admin/shared/provider-health.ts` |
| Halaman dashboard terkait | `/api-keys`, `/usage`, `/billing`, `/models`, `/playground` (UI, data mock) | `PROJECT_MAP.md` |

## 3. Apa itu Surplus Intelligence

Marketplace inferensi LLM: pembeli memakai satu API key dan satu base URL, router memilih penjual (seller) termurah
yang sehat. Penjual memasang endpoint kompatibel OpenAI dengan harga sendiri. Setelmen dalam USDC di jaringan Base;
pembeli juga bisa memakai kredit fiat yang diisi dengan kartu di Surplus. Ini hanya cara nbytes mengisi saldonya
sendiri di Surplus; pengguna nbytes membayar deposit lewat Sumopod, nbytes tidak memakai payment gateway lain. [S1, S2]

Konsekuensi untuk nbytes: **siapa penyedia model sebenarnya per request bisa berganti**, dan biayanya juga.

## 4. Fakta teknis upstream yang dipakai gateway

### 4.1 Base URL dan auth

- Base URL: `https://api.surplusintelligence.ai/v1` (OpenAI-compatible). Permukaan Anthropic:
  `https://api.surplusintelligence.ai/anthropic` (`/v1/messages`). [S1, S2, S4]
- Header: `Authorization: Bearer inf_…` (buyer key: `inf_` + 32 hex). Di permukaan Anthropic juga `x-api-key`. [S2, S4]
- Admin key `inf_admin_…`: bisa membuat/rotasi/cabut buyer key lewat `/v1/keys`, **tidak bisa** inferensi. [S8, S12]

### 4.2 Endpoint inferensi (cakupan D3: semua yang ditawarkan Surplus ke pembeli)

Semua di bawah `https://api.surplusintelligence.ai`. Kolom "Biaya" = cara Surplus menagih nbytes.

| Endpoint upstream | Bentuk | Biaya | Catatan | Sumber |
|---|---|---|---|---|
| `POST /v1/chat/completions` | OpenAI Chat | per token input/output | Wajib `model`, `messages`. Streaming SSE. Tools, gambar (`image_url`), `response_format`, reasoning. | S3 |
| `POST /v1/completions` | OpenAI legacy (`prompt`) | per token | "Same auth, routing, and settlement as chat completions." | S16 |
| `POST /v1/responses` | OpenAI Responses | per token | Usage `input_tokens`/`output_tokens`/`total_tokens`. Hosted tools (file search, code interpreter) dan `previous_response_id` **tidak didukung** di versi pertama mereka. | S17 |
| `POST /v1/decisions` | OpenAI Decisions / JEV | **hanya token input** | Di beberapa environment hanya untuk akun pilot (`403 buyer_not_in_allowlist`). Masuk cakupan atau tidak: D9. | S18 |
| `POST /v1/images/generations`, `/v1/images/edits` | OpenAI Images | harga kanonik × diskon, per token / per gambar / per megapiksel (tergantung model) | Sinkron. Edit: maks 8 gambar sumber, inpaint (`mask`) belum didukung. | S23 |
| `POST /v1/audio/speech` | OpenAI TTS | katalog: per `1K characters` (contoh `venice-kokoro-tts`) | Tidak ada halaman referensi; bentuk dari katalog live. | S19, S31 |
| `POST /v1/audio/transcriptions` | OpenAI STT, multipart, file maks 25 MB | katalog: per `minute` (contoh `venice-whisper-1`) | Tidak ada halaman referensi. | S19, S25, S31 |
| `POST /v1/embeddings` | OpenAI Embeddings | katalog: per `1M tokens` (`venice-embed-1`, satu-satunya model embedding di katalog 2026-11-11) | Tidak ada halaman referensi; tanpa `/min{N}`. | S19, S31 |
| `POST /v1/video/generations`, `/v1/music/generations` | Async: submit (`202`) → poll `GET …/{id}` → batal `DELETE …/{id}` | saldo ditahan sebesar `max_cost_usdc`, ditagih biaya nyata (`usage.buyer_cost_usdc`); job gagal tidak ditagih | `max_cost_usdc` bisa beberapa kali `estimated_cost_usdc`. Job kedaluwarsa 30 mnt (video) / 15 mnt (musik). Hasil di `GET /v1/media/artifacts/{jobId}/{index}` (redirect, bukan JSON), disimpan ±3 jam. `webhook_url` belum dikirim di produksi: harus polling. | S2, S24 |
| `POST /anthropic/v1/messages` (+ `count_tokens`, `GET /anthropic/v1/models`) | Anthropic Messages | per token | Envelope error Anthropic tanpa `code`; kehabisan saldo = `400`, bukan `402`. `count_tokens` hanya estimasi. | S4 |
| `POST /v1/resources/{fal\|wavespeed\|elevenlabs}/…` | Relay API provider media pihak ketiga | dilaporkan provider atau kuotasi, mana yang lebih rendah; gagal = 0 | "Provider Market", hanya kredit prabayar, tanpa streaming, **tanpa idempotensi** (replay = generate ulang dan ditagih). Masuk cakupan atau tidak: D9. | S2, S21 |

Katalog dan referensi harga (tanpa auth): `GET /v1/models` (cache 60 dtk), `GET /v1/models/{id}`, `GET /v1/prices`
(cache 5 mnt), `GET /v1/providers` (cache 5 mnt), `GET /api/markets` (model yang sedang punya penjual, cache 30 dtk). [S5, S20, S22, S32]

Parameter yang **dijamin** di semua model chat: `model`, `messages`, `stream`, `max_tokens`/`max_completion_tokens`,
`temperature`, `top_p`, `stop`, `seed`. Selain itu cek `supported_parameters`; kebanyakan provider mengabaikan
parameter yang tidak didukung tanpa error. Untuk gambar, cek `architecture.input_modalities` **atau**
`supported_features` (keduanya bisa tidak cocok; router menganggap salah satu cukup). [S11, S5]

**Katalog bukan ketersediaan.** Model yang ada di `GET /v1/models` belum tentu punya penjual saat ini; tanpa penjual
→ `404 no_sellers_for_model`. Docs menyebut penjual aktif di produksi saat ini terkonsentrasi di Venice dan Bankr. [S22]

### 4.2a Endpoint akun (dipakai backend nbytes, bukan pengguna)

| Endpoint | Kegunaan | Key yang dibutuhkan |
|---|---|---|
| `GET /v1/payments/balance` | Saldo; angka yang dipakai `credit_balance_usdc` (string mikrodolar) | buyer key |
| `GET /v1/requests`, `GET /v1/requests/{id}` | Log per request (model, provider, token, biaya, status) | lihat §7 butir 4 |
| `GET /v1/buyer/usage/export` | CSV pemakaian, maks 50.000 baris | buyer key |
| `PUT /v1/budgets` | Batas belanja harian/bulanan dengan `hard_stop` | **management key** atau sesi dashboard |
| `POST /v1/webhooks` | Event `usage.recorded`, `request.failed`, dll. Tanda tangan `X-Surplus-Signature` (HMAC-SHA256 atas `{t}.{rawBody}`, tolak bila selisih waktu > 300 dtk). Bentuk payload event **tidak terdokumentasi**. | management key |
| `PUT /v1/notifications/settings` | Peringatan email/Telegram `buyer.balance_low`, `buyer.out_of_balance` | buyer key (management key ditolak) |
| `PUT /v1/payments/auto-topup` | Isi ulang otomatis dari kartu tersimpan | buyer key |

Management key (`inf_admin_…`) pertama hanya bisa dibuat dari dashboard Surplus, tidak lewat API. [S2]

### 4.3 Biaya per request

- Non-streaming: `usage.buyer_cost_micro` (integer mikrodolar, 1 USD = 1.000.000) selalu ada di body; juga header
  `x-si-buyer-cost-micro`. Contoh: `"usage": {"prompt_tokens": 596, "completion_tokens": 2266, "buyer_cost_micro": 2132}`. [S6]
- Streaming: biaya ada di event usage terakhir, dengan `stream_options: {"include_usage": true}` dan upstream yang
  memang mengirim usage; kalau tidak, event diteruskan apa adanya tanpa biaya. [S8]
- Header `x-request-id` dikirim sebelum byte pertama dan berisi id setelmen; biaya pasti dibaca kemudian lewat
  `GET /v1/requests/{id}`. Log request adalah sumber kebenaran; angka inline hanya jalur cepat. [S2, S8]
- `request_id` pada error sebelum routing (auth, validasi, tidak ada penjual) adalah trace id; `404` saat dicari
  berarti "tidak ada tagihan". [S2]
- Unit: `1 USD = 1_000_000` mikrodolar, tetapi **nama field tidak menjamin unit atau tipe JSON** (`_usdc` = mikrodolar
  string; `amountUsd` = dolar). Baca unit per endpoint. [S2]
- Kalau biaya tidak diketahui, field/header **dihilangkan, bukan 0**. Docs: jangan pernah menganggap biaya 0. [S8]
- Token reasoning dihitung di dalam `completion_tokens` dan ditagih dengan tarif output. [S10, S29]
- Harga upstream = harga referensi model × `cost_multiplier` penawaran penjual. [S7] `GET /v1/prices` memuat harga
  list per provider untuk tiap model (USD per 1M token, juga cache dan media), tetapi baris mana yang menjadi
  "harga referensi" untuk satu request **tidak terdokumentasi**; nilai per request ada di `direct_cost_micro`. [S20, S30]

### 4.4 Error dan jebakan status 200

- Envelope `/v1/*`: `{"error": {"type", "code", "message", "detail", "param"}, "request_id"}`. Cabangkan logika
  berdasarkan `code`, bukan `message`. [S2]
- **Request non-streaming yang lama selalu HTTP 200, termasuk saat gagal.** Body diawali spasi JSON. Deteksi gagal
  dengan `data.error || !data.choices`. Header `x-si-*` pindah ke objek body `surplus`. Ambang waktunya
  **tidak terdokumentasi**. [S6]
- Kode penting: 401 `invalid_api_key`; 402 `insufficient_credit`/`budget_exceeded`; 403 `model_not_in_key_scope`;
  404 `no_sellers_for_model`; 429 `rate_limit_exceeded` (+`Retry-After`); 503 `no_healthy_sellers`,
  `route_deadline_exceeded`. [S2]
- 4xx provider yang tidak bisa ditafsirkan dikembalikan sebagai `400`, **tanpa failover**. [S11]
- Failover antar-penjual otomatis di sisi Surplus; docs menyarankan tidak membuat failover sendiri. [S8]
- `x-si-truncated: 1` = jawaban terpotong deadline; satu-satunya tanda jawaban tidak lengkap. [S10]

### 4.5 Batas dan kapasitas

- Rate limit aplikasi: sekitar 1.200 request/menit per key untuk chat/completions. [S2, S8]
- WAF edge: 6.000 request per 5 menit **per IP sumber**; diblokir tanpa header `X-RateLimit-*` dan tanpa body JSON.
  Gateway yang memakai satu IP keluar kena batas ini. Docs menyarankan menyebar IP keluar atau menghubungi Surplus. [S8]
- Request ditolak bila saldo tidak cukup untuk estimasi biaya maksimal; docs menyarankan auto top-up. [S8]
- Batas waktu per request: **tidak terdokumentasi**. Penanda akhir stream (`data: [DONE]`): **tidak terdokumentasi**
  sebagai aturan. [S10]
- Body JSON maks 10 MB di semua endpoint JSON; upload transkripsi maks 25 MB; maks 8 gambar sumber per request
  generasi. Provider bisa menolak lebih kecil. [S25]
- `Idempotency-Key` **tidak dipakai** di endpoint inferensi; mengulang request = generate dan tagihan baru. Submit video
  menerimanya untuk mencegah submit ganda. [S18, S24, S2]
- Routing hanya ke provider "trusted" adalah default akun baru (`preferences.allow_untrusted` untuk membuka). [S27, S28]

### 4.5a Telemetri per request

Header `x-request-id` (selalu ada), `x-si-served-by`, `x-si-provider-family`, `x-si-marketplace-attempts`,
`x-si-attempts` (`provider:offerId:alasan`), `x-si-adapted-params` (parameter yang diubah Surplus),
`x-si-truncated`. Log `GET /v1/requests` memuat provider penyaji, token, `buyer_cost_micro`, `seller_cost_micro`,
`direct_cost_micro` (biaya bila langsung ke provider), latensi, status setelmen. [S10, S28, S30]

### 4.6 Privasi data

- Untuk chat sinkron Surplus menyimpan metadata (model, token, biaya, status), bukan isi prompt/jawaban. [S13]
- **Penjual dan penyedia model menerima isi chat** dan tunduk pada kebijakan mereka sendiri. [S14 §7.2]
- Tidak ada bukti kriptografis bahwa penjual benar-benar menyajikan model yang diklaim. [S13]

### 4.7 Pembayaran ke Surplus

- Kredit prabayar dalam USD, diisi nbytes dengan kartu (Surplus meneruskan biaya pemrosesan kartunya) atau USDC di
  Base. Ini biaya Surplus, bukan payment gateway nbytes: pengguna nbytes hanya membayar lewat Sumopod. [S2, S9]
- Kartu Indonesia / IDR: **tidak terdokumentasi**. [S9]
- Kredit tidak bisa dipindahtangankan atau dijual; kredit fiat tidak bisa ditarik. [S14 §4.1, S9]

## 5. Syarat hukum (Terms of Service, update 14 Oktober 2026)

Menjual ulang **diizinkan dengan syarat** (§8) [S14, S8]:

1. Terms, AUP dan Provider Terms tetap berlaku; pelanggan nbytes setuju syarat yang minimal sama ketatnya.
2. nbytes sepenuhnya bertanggung jawab atas pemakaian, konten dan pembayaran pelanggannya.
3. nbytes tidak boleh tampil seolah disediakan oleh, atau berafiliasi dengan, penyedia model mana pun.
4. nbytes tidak boleh mematikan atau menyamarkan kontrol keamanan, rate limit, batas atau routing Surplus.

Larangan yang perlu dicek: §8 melarang memakai layanan untuk membangun "directly competing routing service".
**Apakah nbytes termasuk kategori ini belum dibuktikan** → tanyakan ke Surplus (support@surplusintelligence.ai)
sebelum membangun. Kewajiban tambahan: pelanggan nbytes juga tunduk pada AUP Surplus dan terms tiap penyedia model
(aturan yang lebih ketat berlaku). [S15]

## 6. Dampak ke desain nbytes yang sudah ada

| Asumsi saat ini | Fakta upstream | Dampak |
|---|---|---|
| Biaya upstream tetap per model per 1M token (`models-data.ts`) | Biaya berubah per request tergantung penjual; biaya aktual datang di `buyer_cost_micro` | Rumus `applyMarkup` per 1M token tidak bisa memakai biaya tetap; lihat keputusan D2 |
| Kesehatan per provider (OpenAI, Anthropic, ...) | Surplus menyembunyikan identitas penjual; yang terlihat hanya family provider, jumlah percobaan dan alasan gagal (`x-si-attempts`, `x-si-served-by`) | Halaman admin Provider perlu didefinisikan ulang; lihat D5 |
| Daftar model statis 12 model | Daftar model dinamis dari `GET /v1/models` | Lihat D4 |
| Logo/nama penyedia model di landing dan katalog | Terms §8: dilarang tampil berafiliasi dengan penyedia model | Perlu dicek apakah menampilkan nama model saja cukup aman; **belum dibuktikan** |
| Harga model di katalog mock (mis. Claude Sonnet 4.5 $3/$15) | Harga list live di `GET /v1/models`, berubah; contoh 2026-11-11: `claude-opus-4.6` input $5, output $25 per 1M token | Harga mock harus diganti data dari katalog yang dikurasi admin |

### 6.1 Harga jual (D2, disetujui owner 2026-11-11)

Fakta yang dipakai:

- Biaya teks = harga referensi model × `cost_multiplier` penawaran penjual, per token input dan output; baca dan tulis
  cache bisa dihitung terpisah. [S7, S30]
- Key Surplus bisa diberi lantai diskon `min_discount_pct` (0–100). Router hanya memilih penawaran yang estimasi
  biayanya minimal N% di bawah harga list langsung; kalau tidak ada, request gagal `404 minimum_discount_not_met`,
  **tidak** dialihkan ke harga lebih mahal. Lantai ini aktif di produksi. [S26, S28]
- Estimasi memakai `max_tokens` (default 4096), jadi diskon nyata per request bisa sedikit berbeda dari lantai.
  Angka pasti ada di `GET /v1/requests/{id}` (`buyer_cost_micro` dan `direct_cost_micro`). [S26, S30]
- Katalog `GET /v1/models` memuat harga per model: teks per token (`prompt`, `completion`, `input_cache_read`,
  `input_cache_write`), media lewat `pricing.image` + `pricing.media_unit` (`image`, `minute`, `1K characters`,
  `1M tokens`, `job`). Apakah angka katalog sama dengan "harga referensi" yang dipakai menghitung diskon:
  **belum dibuktikan**. [S31]

Keputusan:

1. Admin menetapkan **harga jual tetap** per model yang dikurasi (per 1M token input/output/cache, atau per unit
   media), disimpan integer mikrodolar. Pengguna melihatnya sebelum memakai, dan tagihan pengguna = pemakaian ×
   harga jual, bisa dihitung pasti.
2. Titik awal harga jual = harga list model dari katalog Surplus. Menjual di atas atau di bawah list adalah keputusan
   bisnis owner.
3. Semua key Surplus milik nbytes diberi `min_discount_pct: 25` (D2a). Bila harga
   jual = harga list, margin kotor per request diperkirakan ≥ 25% dari harga list. Trade-off: makin tinggi lantai,
   makin sering model tidak tersedia (`404 minimum_discount_not_met`). Pengecualian: `/v1/embeddings` tidak punya
   lantai diskon [S26], jadi biayanya tidak dibatasi cara ini dan harga jualnya perlu ditinjau lebih sering.
4. Setiap request mencatat harga jual (pendapatan) dan `buyer_cost_micro` (biaya). Admin melihat margin nyata per model
   dan mendapat peringatan bila ada request dengan margin negatif.
5. Rumus admin yang ada (`applyMarkup` di `margin-math.ts`) tetap dipakai, tetapi dasarnya berganti dari "biaya
   upstream tetap" (mock) menjadi "harga list Surplus"; markup boleh 0 atau negatif. Default 0% (D2b).

D2b diputuskan: harga jual = harga list (markup default 0%). Rincian tagihan, saldo dan deposit ada di
`PRD/gateway-pricing-billing.md`.

Pilihan yang ditolak: "biaya aktual + markup" (harga ke pengguna tidak bisa ditampilkan pasti di
muka, dan biaya streaming kadang baru diketahui saat rekonsiliasi), dan "harga tetap tanpa lantai diskon" (biaya
upstream tidak dibatasi, bisa rugi).

## 7. Pertentangan di docs Surplus (tanyakan ke vendor)

1. Batas top-up kartu: $10–$2.000 (llms.txt) vs $5–$5.000 per transaksi (Terms §4.2).
2. `stream_options.include_usage`: "auto-injected" (halaman chat-completions, parameter-compatibility) vs harus dikirim
   sendiri (llms.txt, whitelabel). Aman: gateway selalu mengirimnya.
3. Default `hard_stop` budget key: aktif (whitelabel) vs hanya peringatan tanpa `hard_stop: true` (llms.txt).
4. Scope untuk `GET /v1/requests/{id}`: `requestlog.read` (routing-controls) vs bisa dibaca key pembuatnya (whitelabel)
   vs `usage.read` (llms.txt).
5. Penyimpanan isi request opsional (`body_capture_enabled`): ada (llms.txt) vs "mungkin di masa depan" (Terms §7.2)
   vs tidak ada (security-privacy).
6. `max_price_per_1m`: kontrol aktif (llms.txt) vs sudah dipensiunkan (chat-completions, pricing).
7. Batas jumlah secret untuk masking: 2.000 (api-reference) vs 500 (llms.txt).
8. Contoh harga `claude-opus-4.6` di halaman models ($15/$75 per 1M) berbeda dengan katalog live 2026-11-11 ($5/$25).
   Contoh docs dianggap usang; pakai katalog live.

## 8. Keputusan yang dibutuhkan dari owner

| # | Pertanyaan | Status | Catatan |
|---|---|---|---|
| D1 | Pola integrasi | **Diputuskan: B.** nbytes mengurus pelanggan, key, saldo dan billing sendiri; Surplus dipanggil dengan beberapa key milik nbytes. | Pola A (satu key Surplus per pelanggan) ditolak; batasnya juga 200 key aktif per workspace. [S8] |
| D2 | Cara menghitung harga jual | **Diputuskan: §6.1.** Harga jual tetap per model yang dikurasi, titik awal harga list Surplus, biaya dibatasi lantai diskon `min_discount_pct` pada key Surplus nbytes. | |
| D2a | Angka lantai diskon | **Diputuskan: 25, sama untuk semua model** (`min_discount_pct: 25` pada key Surplus nbytes). | Makin tinggi, makin sering `404 minimum_discount_not_met`. Tidak berlaku untuk `/v1/embeddings` (§6.1 butir 3). |
| D2b | Posisi harga jual | **Diputuskan (rekomendasi diterima owner): harga jual = harga list**, markup default 0%; admin bisa mengubah per model. | Rincian di `PRD/gateway-pricing-billing.md`. |
| D3 | Cakupan versi pertama | **Diputuskan: lengkap**, bukan hanya chat completions. Daftar endpoint di §4.2. | Urutan pengerjaan per endpoint masih terbuka (§8.1). |
| D4 | Sumber daftar model | **Diputuskan: dikurasi admin.** Admin memilih dari katalog Surplus (`GET /v1/models`); yang tidak dipilih tidak bisa dipanggil pengguna. | |
| D5 | Halaman admin Provider | **Diputuskan (owner, 2026-11-12):** diganti halaman "Upstream" tentang Surplus, rincian di `PRD/admin-requests-upstream.md`. | Identitas penjual disembunyikan Surplus. [S10] |
| D6 | Mata uang ke pengguna | **Diputuskan: saldo dan harga dalam USD; deposit dibayar dalam IDR** dan otomatis dikonversi ke USD dengan kurs yang dimasukkan admin secara manual. | Rincian di `PRD/gateway-pricing-billing.md`. |
| D7 | Konfirmasi legal | Siapa yang menghubungi Surplus soal klausul "competing routing service" dan kartu Indonesia? | Blok sebelum produksi. |
| D8 | Privasi pelanggan | Apakah pelanggan perlu diberi tahu bahwa isi chat dikirim ke penjual pihak ketiga yang tidak diketahui identitasnya? | Terms §7.2. |
| D9 | Batas "lengkap" (D3) | Apakah `/v1/decisions` (bisa terbatas akun pilot) dan Provider Market `/v1/resources/*` (relay API Fal, Wavespeed, ElevenLabs, bukan endpoint model biasa) ikut? | Usulan: endpoint OpenAI dan Anthropic di §4.2 ikut; dua ini ditunda sampai diminta. |
| D10 | Akun Surplus | Siapa yang membuat organization khusus nbytes dan management key di dashboard Surplus? | Management key pertama hanya bisa dibuat dari dashboard. [S2] |

### 8.1 Urutan pengerjaan (usulan, karena D3 = lengkap)

1. Fondasi: key API nbytes, saldo pengguna, pencatatan request dan biaya, klien Surplus, katalog yang dikurasi.
2. Teks: `/v1/chat/completions` (+ streaming), `/v1/completions`, `/v1/responses`, `/v1/models`.
3. Permukaan Anthropic: `/anthropic/v1/messages` (+ `count_tokens`, `models`).
4. Media sinkron: `/v1/embeddings`, `/v1/images/*`, `/v1/audio/*`.
5. Media async: `/v1/video/*`, `/v1/music/*` (butuh tahan-lalu-potong saldo dan polling job).

## 9. Kebutuhan minimum yang sudah pasti (apa pun keputusan §8)

1. API key Surplus hanya di env server (`SURPLUS_API_KEY`, nama final menyusul), tidak pernah ke klien.
2. Setiap request pengguna: autentikasi key nbytes → validasi body (`*-contract.ts`) → cek saldo → panggil Surplus →
   catat token dan `buyer_cost_micro` → potong saldo. Uang disimpan integer mikrodolar.
3. Respons non-streaming diperiksa dari body (`error`/`choices`), bukan status HTTP saja.
4. Biaya yang hilang (field tidak ada) **tidak dicatat sebagai 0**; request ditandai untuk rekonsiliasi lewat
   `GET /v1/requests/{id}`.
5. Streaming selalu mengirim `stream_options: {"include_usage": true}`.
6. Simpan `request_id` Surplus per request untuk rekonsiliasi dan audit.
7. Field routing Surplus (`provider`, `si_route`, ...) dari pengguna: diteruskan, dibuang, atau dibatasi?
   **Termasuk D3.** Terms §8 melarang menyamarkan kontrol routing Surplus.
8. Pesan error ke pengguna generik; detail upstream hanya di log server (aturan proyek).
9. Katalog nbytes hanya berisi model yang dikurasi admin (D4); model di luar daftar ditolak sebelum memanggil Surplus.
10. Media async: saat submit, saldo pengguna ditahan sebesar biaya maksimal; saat job selesai, dipotong sesuai biaya
    akhir dan sisanya dilepas; job gagal tidak ditagih (Surplus juga tidak menagih). Simpan id job Surplus.
11. Error dipetakan per permukaan: `/v1/*` memakai envelope OpenAI dengan `code`; `/anthropic/*` memakai envelope
    Anthropic tanpa `code` (kehabisan saldo = `400 invalid_request_error`), meniru perilaku Surplus. [S2, S4]
12. Gateway **tidak** mengulang request inferensi secara otomatis setelah kegagalan yang tidak jelas, karena Surplus tidak
    memakai `Idempotency-Key` di sana dan pengulangan bisa ditagih dua kali; failover sudah dilakukan Surplus. [S8, S18]
13. Saldo nbytes di Surplus dipantau: auto top-up dan peringatan `buyer.balance_low` dinyalakan. [S2, S8]

## 10. Lokasi file (sesuai `architecture.md`, usulan)

| Isi | Lokasi |
|---|---|
| Klien HTTP ke Surplus | `src/lib/server/gateway/surplus-client.ts` (`import "server-only"`) |
| Validasi body per endpoint | `src/lib/gateway/*-contract.ts` (folder karena ≥ 3 berkas) |
| Route OpenAI-compatible | `src/app/api/v1/<endpoint>/route.ts` untuk tiap endpoint di §4.2 |
| Route Anthropic | `src/app/api/anthropic/v1/messages/route.ts` (+ `count_tokens`, `models`) |
| Skema DB | `src/lib/server/db/schema/gateway.ts` (+ ekspor di `index.ts`) |

Path route `/api/v1/...` vs domain terpisah (`api.nbytes...`) **belum diputuskan**. Skema DB dan kontrak API final
belum ditulis; D2 sudah diputuskan, jadi keduanya bisa disusun berikutnya.

## 11. Belum dibaca / belum dibuktikan

- OpenAPI spec `https://api.surplusintelligence.ai/api/ops/openapi.json`: HTTP 401 tanpa kredensial. Mungkin bisa
  dibuka dengan key Surplus: **belum dibuktikan**.
- Halaman yang hanya dibaca judul bagiannya (isinya untuk sisi penjual atau setup klien, bukan gateway pembeli):
  `api-reference/seller-endpoints`, `getting-started/seller-quickstart`, `marketplace/provider-market-listing`,
  `marketplace/provider-market-providers`, `marketplace/provider-market-access`, `marketplace/provider-market-jobs`,
  `guides/claude-code-setup`, `guides/cursor-setup`, `guides/opencode-setup`, `guides/wallet-funding`,
  `guides/secret-masking`, `organizations/*` selain `api-keys`, `payments/x402`, `payments/prefunded-usdc`.
- Tidak ada halaman referensi untuk `/v1/embeddings` dan `/v1/audio/*`; bentuk request/response diasumsikan mengikuti
  OpenAI: **belum dibuktikan**.
- Bentuk payload event webhook (`usage.recorded`, dll.): tidak terdokumentasi.
- Belum ada request nyata ke API Surplus (belum punya key). Bentuk chunk streaming, field usage lengkap, dan
  hubungan harga katalog dengan harga referensi diskon baru pasti setelah diuji.

## 12. Sumber (dibaca 2026-11-11)

| Kode | URL |
|---|---|
| S1 | https://www.surplusintelligence.ai/docs |
| S2 | https://www.surplusintelligence.ai/llms.txt |
| S3 | https://www.surplusintelligence.ai/docs/api-reference/chat-completions |
| S4 | https://www.surplusintelligence.ai/docs/api-reference/messages |
| S5 | https://www.surplusintelligence.ai/docs/api-reference/models |
| S6 | https://www.surplusintelligence.ai/docs/reference/long-running-responses |
| S7 | https://www.surplusintelligence.ai/docs/marketplace/pricing |
| S8 | https://www.surplusintelligence.ai/docs/getting-started/whitelabel |
| S9 | https://www.surplusintelligence.ai/docs/payments/fiat |
| S10 | https://www.surplusintelligence.ai/docs/marketplace/routing-controls |
| S11 | https://www.surplusintelligence.ai/docs/reference/parameter-compatibility |
| S12 | https://www.surplusintelligence.ai/docs/organizations/api-keys |
| S13 | https://www.surplusintelligence.ai/docs/marketplace/security-privacy |
| S14 | https://www.surplusintelligence.ai/terms-of-service |
| S15 | https://www.surplusintelligence.ai/acceptable-use-policy |
| S16 | https://www.surplusintelligence.ai/docs/api-reference/completions |
| S17 | https://www.surplusintelligence.ai/docs/api-reference/responses |
| S18 | https://www.surplusintelligence.ai/docs/api-reference/decisions |
| S19 | https://www.surplusintelligence.ai/docs/api-reference/index |
| S20 | https://www.surplusintelligence.ai/docs/api-reference/prices |
| S21 | https://www.surplusintelligence.ai/docs/marketplace/provider-market |
| S22 | https://www.surplusintelligence.ai/docs/marketplace/models |
| S23 | https://www.surplusintelligence.ai/docs/api-reference/image-generations |
| S24 | https://www.surplusintelligence.ai/docs/api-reference/video-generations dan `music-generations` |
| S25 | https://www.surplusintelligence.ai/docs/guides/media-inputs |
| S26 | https://www.surplusintelligence.ai/docs/marketplace/minimum-discount-routing |
| S27 | https://www.surplusintelligence.ai/docs/marketplace/health-routing |
| S28 | https://www.surplusintelligence.ai/docs/marketplace/provider-verification |
| S29 | https://www.surplusintelligence.ai/docs/reference/reasoning |
| S30 | https://www.surplusintelligence.ai/faq |
| S31 | `GET https://api.surplusintelligence.ai/v1/models`, diambil 2026-11-11 (527 model) |
| S32 | https://www.surplusintelligence.ai/docs/api-reference/markets |
| - | Juga dibaca: `docs/api-reference/buyer-endpoints`, `docs/reference/changelog` |
