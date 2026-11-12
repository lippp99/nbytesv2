# PRD: Harga Jual, Saldo dan Deposit (AI Gateway)

| | |
|---|---|
| Status | Draft v2. Keputusan inti (§2) dan turunan B1–B9 (§13) sudah diputuskan. Sisa: hal yang belum dibuktikan (§14) diuji di Sandbox. |
| Tanggal | 2026-11-11 |
| Repo | `nbytesv2` (branch `develop`) |
| Induk | `PRD/ai-gateway.md` (fakta upstream Surplus dan sumber S1–S32 ada di sana) |
| Cakupan | Harga jual per model, saldo pengguna (USD), deposit (IDR → USD), kurs manual, tagihan per request, tahan-lalu-potong saldo, rekonsiliasi dengan Surplus, angka admin |
| Di luar cakupan | Kontrak endpoint dan key API pengguna (`PRD/gateway-api.md`, menyusul), paket langganan bulanan, UI final |

Fakta upstream merujuk ke kode sumber `PRD/ai-gateway.md` §12 (mis. [S26]). Yang tidak bisa dibuktikan ditandai
**belum dibuktikan**. Bagian bertanda **usulan** adalah rekomendasi yang diterima owner sebagai arah ("selebihnya
rekomendasimu", 2026-11-11); angka di dalamnya boleh diganti owner.

---

## 1. Tujuan

1. Pengguna tahu harga per model sebelum memakai, dan tagihan per request bisa dihitung pasti.
2. Pengguna mengisi saldo dalam rupiah; saldo dan pemakaian tercatat dalam USD.
3. nbytes tidak pernah membayar Surplus lebih mahal dari 75% harga list untuk model yang punya lantai diskon.
4. Setiap rupiah masuk, setiap mikrodolar saldo, dan setiap biaya Surplus bisa ditelusuri dan dicocokkan.

## 2. Keputusan yang dipakai

| # | Keputusan | Sumber |
|---|---|---|
| D1 | Pola B: nbytes mengurus pelanggan, saldo dan tagihan; Surplus dipanggil dengan key milik nbytes. | owner, `ai-gateway.md` §8 |
| D2 | Harga jual tetap per model yang dikurasi admin; titik awal harga list Surplus. | owner, `ai-gateway.md` §6.1 |
| D2a | `min_discount_pct: 25` di semua key Surplus nbytes, sama untuk semua model. | owner |
| D2b | Harga jual = harga list, markup default 0%; admin bisa mengubah per model. | rekomendasi, diterima owner |
| D6 | Saldo dan harga dalam **USD**. Deposit dibayar dalam **IDR**, dikonversi otomatis ke USD dengan kurs yang dimasukkan admin secara manual. | owner |

Akibat D2a + D2b: untuk model teks dan media yang punya lantai diskon, biaya Surplus per request diperkirakan
≤ 75% dari yang ditagih ke pengguna, jadi margin kotor diperkirakan ≥ 25%. Estimasi Surplus memakai `max_tokens`
sehingga angka nyata per request bisa sedikit berbeda [S26]. `/v1/embeddings` tidak punya lantai [S26].

## 3. Kondisi kode saat ini (bukti)

| Bagian | Keadaan | Bukti |
|---|---|---|
| Tabel saldo, deposit, harga, request | Belum ada. Skema hanya domain auth. | `src/lib/server/db/schema/auth.ts`, `PRD/account-settings.md` (tabel DB) |
| Halaman Billing pengguna | Mock **pascabayar**: "Tagihan dihitung per token setiap bulan dan dibayar di akhir periode", daftar invoice bulanan | `src/components/dashboard/billing/billing-copy.ts`, `billing-data.ts` |
| Keuangan admin | Mock: pendapatan, biaya upstream, top-up dan tagihan; metode "Kartu", "QRIS", "Virtual account", "Transfer bank" | `src/components/admin/billing/billing-data.ts` |
| Biaya top-up | Mock `defaultTopUpFeeBp = 500` (5%), `paymentFeeBp = 290`; keputusan baru 3% (B3) belum diterapkan di mock | `src/components/admin/models/models-data.ts`, `PRD/backend-auth-admin.md` Lampiran A.8 |
| Hapus akun | Sudah aktif; PRD-nya meminta ditinjau ulang saat billing dibuat (risiko saldo prabayar) | `PRD/account-settings.md` S5 |

**Pertentangan:** D6 (deposit di muka) berarti model **prabayar**, sedangkan halaman Billing pengguna saat ini
pascabayar dengan invoice bulanan. Halaman itu harus diubah (§11). Perubahan UI tidak termasuk dokumen ini.

## 4. Satuan uang

| Besaran | Satuan simpan | Tipe |
|---|---|---|
| Saldo, harga, tagihan, biaya Surplus | mikrodolar USD (1 USD = 1.000.000) | integer (`bigint`) |
| Nominal deposit, biaya deposit | rupiah utuh | integer (`bigint`) |
| Kurs | rupiah per 1 USD, utuh (mis. `16850`) | integer |
| Persen (markup, biaya top-up) | basis point (100 = 1%) | integer |

Tidak ada float di jalur uang (aturan proyek, `.claude/rules/backend-security.md`). Waktu disimpan UTC.

## 5. Kurs manual (D6)

1. Admin memasukkan kurs "1 USD = X rupiah" di halaman admin. Setiap perubahan dicatat (siapa, kapan, nilai lama
   dan baru) di audit log, dan menjadi baris baru; baris lama tidak diubah.
2. Kurs dikunci saat pengguna **membuat** permintaan deposit, bukan saat pembayaran masuk. Deposit dikreditkan dengan
   kurs yang dikunci itu. Permintaan deposit kedaluwarsa dalam 24 jam, sama dengan `expires_in_hours` maksimal Sumopod
   [P6], agar kurs lama tidak dipakai berhari-hari.
3. Konversi: `kredit_mikro = floor(nominal_idr × 1_000_000 / kurs)`. Dibulatkan ke bawah agar tidak pernah
   mengkreditkan lebih dari yang dibayar.
   Contoh: Rp 100.000 pada kurs 16.850 → 5.934.718 mikrodolar = $5,934718 (ditampilkan $5,93).
4. Pengguna melihat pratinjau sebelum membayar: nominal rupiah, kurs, saldo USD yang akan masuk.
5. Kurs admin memuat selisih aman di atas kurs pasar, karena nbytes membayar Surplus dalam USD lewat kartu (biaya
   Stripe dan kurs bank tidak bisa dihitung pasti di muka) [S2]. Besarnya: kurs pasar + 4% sebagai awal (B4, §13).
6. Kurs kosong atau belum pernah diisi → deposit ditolak dengan pesan umum; tidak ada kurs bawaan di kode.

## 6. Deposit (IDR → saldo USD)

### 6.1 Alur

1. Pengguna memilih nominal rupiah: min Rp 50.000, maks Rp 10.000.000 (B2, §13).
2. Server membuat permintaan deposit: nominal, biaya deposit, kurs terkunci, kredit USD, kedaluwarsa. Status `pending`.
3. Server membuat pembayaran di Sumopod (B1, §6.3) dan mengarahkan pengguna ke `payment_link_url`.
4. Sumopod mengirim webhook. Server **memverifikasi tanda tangan** dulu, lalu memeriksa `order_id` dan `amount` sama
   dengan permintaan deposit, lalu mengkreditkan saldo **sekali** (idempoten per `payment_id` Sumopod).
5. `payment.completed` → status `paid`, entri `deposit` masuk buku saldo (§8). `payment.failed` / `payment.expired` →
   status `failed` / `expired`, saldo tidak berubah.

Redirect setelah bayar **bukan** bukti pembayaran; hanya webhook terverifikasi yang mengkreditkan saldo.

### 6.2 Biaya deposit

**Diputuskan owner (B3, 2026-11-11): biaya deposit 3%** di atas nominal (pengguna membayar nominal + biaya), bisa
diatur admin. `PRD/backend-auth-admin.md` Lampiran A.8 sudah memakai 3%; mock `defaultTopUpFeeBp = 500` di kode belum.
Biaya dihitung dalam rupiah, dibulatkan ke atas ke rupiah utuh, dan tidak menambah saldo. Contoh: deposit
Rp 100.000, biaya 3% → pengguna membayar Rp 103.000, saldo bertambah sesuai Rp 100.000.

Biaya Sumopod (QRIS 0,7% + Rp 300) secara default dipotong dari uang yang diterima nbytes, dan tertutup oleh biaya
deposit 3% asalkan nominal ≥ batas minimal B2. Contoh: pengguna membayar Rp 103.000 → biaya Sumopod Rp 1.021 → nbytes
menerima Rp 101.979 (sisa Rp 1.979 di atas nominal). Pembulatan biaya oleh Sumopod: **ke atas** (diuji Sandbox
2026-11-11: tagihan Rp 51.500 → 0,7% = Rp 360,5 → Rp 361 + Rp 300 = biaya Rp 661, nbytes menerima Rp 50.839). Setelan
"Charge fee to customer" di Sumopod **dibiarkan mati**, agar nominal yang dibayar pengguna tetap sama dengan yang
dibuat server dan bisa dicocokkan di webhook. [P1, P3, P6]

### 6.3 Integrasi Sumopod Managed Payment (B1)

Sumber: docs Sumopod [P1–P5] dan tangkapan layar dashboard Sumopod dari owner [P6–P15]. Isi tangkapan layar sudah
disalin ke bagian ini, jadi berkas gambarnya tidak dibutuhkan lagi.

**Mode dan key.** Sandbox (data palsu) dan Live punya API key, webhook URL, redirect URL dan secret webhook yang
**terpisah**; key Sandbox tidak boleh dipakai di produksi. Live butuh verifikasi bisnis lewat "Register for Live
Access". [P1, P5] Semua secret disimpan di env server, tidak pernah ke klien.

**Membuat pembayaran.** `POST https://api-pay-sandbox.sumopod.com/api/v1/payments`, header `X-Api-Key`. [P1, P6]

| Field | Isi dari nbytes | Catatan Sumopod |
|---|---|---|
| `order_id` | id permintaan deposit nbytes | Wajib unik di Sumopod atau tidak: **tidak terdokumentasi** |
| `amount` | nominal + biaya deposit, rupiah utuh | Integer, contoh `50000` |
| `currency` | `"IDR"` | |
| `expires_in_hours` | 24 | Opsional, default 24, **maksimal 24** |
| `success_return_url`, `cancel_return_url` | halaman Billing nbytes | Opsional, menimpa setelan project |
| `payment_method_type_code` | `QRIS` (B8, diputuskan) | Opsional. **Hanya dua channel** (dikonfirmasi owner dari dashboard, 2026-11-11): QRIS, kode tampil `qris` (cair 2 hari, 0,7% + Rp 300), dan QRIS Instant `QRIS_INSTANT` (cair 0 hari, 1,5% + Rp 300). nbytes mengirim `"QRIS"` huruf besar (seperti contoh curl); **diterima** API Sandbox (diuji 2026-11-11). Di webhook, `payment_method` berisi `qris` huruf kecil [P1, P6, P15] |

Respons: `payment_id`, `order_id`, `amount`, `fee`, `net_amount`, `payment_link_url`, `payment_code`,
`payment_code_type`, `payment_channel_used`, `status` (`pending`), `expires_at`. Semua disimpan di baris deposit. [P7]

**Webhook.** URL diatur di Settings → Webhook. Event: `payment.completed`, `payment.failed`, `payment.expired`,
`payment.test`. Payload: `{ "event_type", "data": { payment_id, order_id, amount, fee, net_amount, status,
payment_method, paid_at, settled_at, completed_at } }`. `paid_at` = waktu pengguna membayar (dipakai sebagai waktu
deposit); `settled_at` = **perkiraan** waktu dana masuk Available Balance (T+2); `completed_at` = sama dengan
`settled_at` (kompatibilitas lama). Endpoint harus membalas 2xx dalam 10 detik; bila tidak, webhook ditandai gagal
dan **hanya bisa dikirim ulang manual** dari tab Webhooks. [P2, P8]

**Verifikasi (dipakai: tanda tangan).** Header `svix-id`, `svix-timestamp`, `svix-signature`. Secret `whsec_…`:
buang awalan `whsec_`, decode base64, lalu HMAC-SHA256 atas `{svix-id}.{svix-timestamp}.{rawBody}`, hasil base64.
`svix-signature` bisa berisi beberapa nilai `v1,<sig>` dipisah spasi (±24 jam setelah secret dirotasi). [P2, P9]
Tambahan dari nbytes (tidak ada di contoh Sumopod): bandingkan dengan perbandingan waktu-konstan, tolak
`svix-timestamp` yang terlalu jauh dari waktu server (batasnya keputusan teknis saat implementasi), dan simpan
`svix-id` untuk menolak kiriman ulang yang sama. Body dibaca mentah sebelum di-parse.
Alternatif `X-Webhook-Token` (`whtok_…`, dibandingkan langsung) **tidak dipakai**: token statis tanpa tanda tangan atas
isi, lebih lemah, sedangkan aturan proyek mewajibkan verifikasi tanda tangan provider. [P2, P10]

**Urutan di endpoint webhook nbytes:** verifikasi tanda tangan → `payment.test` dibalas 200 tanpa aksi → cari deposit
lewat `order_id` → cocokkan `payment_id` dan `amount` → ubah status dan kreditkan saldo dalam satu transaksi →
balas 200. Event untuk deposit yang sudah final dibalas 200 tanpa aksi (idempoten). Data tidak cocok → tidak
mengkreditkan, catat, peringatan admin.

**Setelan dashboard Sumopod (Settings, per mode Sandbox/Live).** Lima bagian: API Key, Webhook, Redirect URLs, Fee
Settings, Checkout Settings. [P3, P11–P14] Nilai di tangkapan layar owner hanya contoh dan **tidak** dipakai sebagai
acuan.

| Bagian | Yang tersedia di Sumopod | Setelan nbytes (usulan) |
|---|---|---|
| Webhook | Webhook URL + "Save & Test" (mengirim `payment.test`); Signing Secret `whsec_…` (Reveal, Rotate); Webhook Token `whtok_…` (Reveal, Rotate) [P11] | URL = endpoint webhook nbytes di lingkungan itu (path ditetapkan di `PRD/gateway-api.md`). Signing Secret disimpan di env server. Token tidak dipakai. Rotasi secret: setelah rotate, ganti env; tanda tangan lama dan baru sama-sama dikirim ±24 jam [P9] |
| Redirect URLs | Success Return URL dan Cancel Return URL bawaan; bisa `https://`, `http://`, atau link aplikasi; bisa ditimpa per pembayaran lewat API [P12] | Bawaan diisi halaman Billing nbytes sebagai cadangan; tiap pembayaran mengirim `success_return_url`/`cancel_return_url` sendiri ke halaman status deposit itu |
| Fee Settings | "Charge fee to customer": mati = biaya dipotong dari uang diterima; nyala = biaya ditambahkan ke tagihan pelanggan [P13] | **Mati** (alasan di §6.2) |
| Checkout Settings | Bawaan: pelanggan membayar di halaman payment-link Sumopod dan **memilih channel sendiri**. "Use custom checkout page": pelanggan membayar langsung di halaman checkout Sumopod, dan respons Create Payment memuat field tambahan untuk membangun halaman sendiri (contohnya ada di tautan "View example" yang **belum dilihat**). Logo checkout opsional: JPEG/PNG, min 128×128 px, maks 900 KB [P14] | **Mati** (pakai payment-link bawaan): tidak perlu membangun halaman bayar, dan field tambahannya belum terdokumentasi. Logo nbytes boleh diunggah (pilihan owner) |

Catatan: channel yang bisa dipilih di halaman payment-link hanya QRIS dan QRIS Instant [P15].
`payment_channel_used: "BRI.VA"` di contoh respons create [P7] hanya contoh umum docs. Hasil uji Sandbox 2026-11-11
untuk QRIS: `payment_channel_used: "QRIS"`, `payment_code_type: "QR_TEXT"`, `payment_code` berisi teks QR (64 karakter),
`payment_link_url` di `https://pay-sandbox.sumopod.com/pay/<payment_id>`.

**Kirim ulang webhook (diuji Sandbox 2026-11-11):** tombol Resend di tab Webhooks mengirim event yang sama dengan
`svix-id` **baru**. Jadi penyimpanan `svix-id` hanya menahan kiriman ulang yang persis sama; yang mencegah saldo
dikreditkan dua kali adalah cek "deposit sudah final" dan indeks unik satu kredit per deposit di buku saldo.

**Pencairan.** Saldo Sumopod (Available / Pending / Hold / Frozen) ditarik manual dari dashboard ke rekening bank
project: biaya Rp 2.500 per penarikan, contoh batas Rp 12.500–Rp 10.000.000 per permintaan, hanya Available Balance.
Tidak ada API penarikan di docs. Uang ini yang dipakai owner untuk membeli kredit Surplus (USD). [P1, P3]

## 7. Harga jual dan tagihan per request

### 7.1 Harga per model

- Admin memilih model dari katalog Surplus (`GET /v1/models`) dan menyimpan harga jualnya. Harga list awal diambil dari
  katalog: teks per token (`prompt`, `completion`, `input_cache_read`, `input_cache_write`), media per
  `pricing.media_unit` [S31]. Disimpan sebagai mikrodolar per 1M token atau per unit.
- Harga jual = harga list × (1 + markup), markup default 0% (D2b), dibulatkan ke atas ke mikrodolar utuh.
  Catatan 2026-11-12: `applyMarkup` di `src/components/admin/models/margin-math.ts` (mock admin) membulatkan ke **sen**,
  bukan ke mikrodolar; backend (`src/lib/gateway/price-math.ts`) mengikuti dokumen ini (mikrodolar). Halaman admin
  perlu diselaraskan saat dihubungkan ke data nyata.
- Harga list Surplus bisa berubah. **Usulan:** sinkron katalog harian; bila harga list berubah, admin mendapat
  peringatan dan memutuskan; harga jual **tidak** berubah otomatis. Perubahan harga jual dicatat di audit log dan
  diumumkan ke pengguna sebelum berlaku (sudah diatur `PRD/backend-auth-admin.md` Lampiran A.8).
- Bila harga list naik tetapi harga jual tetap, lantai 25% tetap membatasi biaya terhadap harga list **baru**, sehingga
  margin bisa turun di bawah 25%. Ini yang dipantau peringatan margin (§10).

### 7.2 Rumus tagihan teks

```
tagihan_mikro = ceil( ( token_input        × harga_input
                      + token_output       × harga_output
                      + token_cache_read   × harga_cache_read
                      + token_cache_write  × harga_cache_write ) / 1_000_000 )
```

Harga dalam mikrodolar per 1M token. Token dari `usage` respons Surplus; token reasoning sudah di dalam token output
[S29]. Nama field token cache di respons chat: **belum dibuktikan** (perlu uji langsung).

### 7.3 Media

| Endpoint | Unit (katalog) | Jumlah unit diketahui dari | Status |
|---|---|---|---|
| Images | `image`, megapiksel, atau token | `n`, `size` di request (per gambar/MP) atau `usage` (per token) [S23] | jumlah unit per gambar/MP dari request: pasti; per token: dari `usage` |
| TTS `/v1/audio/speech` | `1K characters` | panjang teks input | **belum dibuktikan** cara Surplus menghitung karakter |
| STT `/v1/audio/transcriptions` | `minute` | durasi audio | **belum dibuktikan**; durasi tidak tersedia sebelum diproses |
| Embeddings | `1M tokens` | `usage` respons | **belum dibuktikan** bentuk `usage` |
| Video, musik | `job` (dan lainnya per model) | hasil job (`usage.buyer_cost_usdc`) [S24] | lihat §9 |

Untuk unit yang belum dibuktikan, rumusnya ditetapkan setelah uji langsung dengan key Surplus (§14).

### 7.4 Request gagal

- Error sebelum Surplus memanggil penjual (auth, validasi, saldo, tidak ada penjual) → tidak ditagih.
- Respons gagal (termasuk HTTP 200 berisi `error` pada request panjang [S6]) → **usulan:** pengguna tidak ditagih.
  Bila Surplus tetap menagih nbytes (`buyer_cost_micro` ada), biaya itu dicatat sebagai kerugian nbytes.
- Respons terpotong (`x-si-truncated: 1` [S10]) → ditagih sesuai token yang benar-benar diterima.

## 8. Buku saldo

- Setiap perubahan saldo adalah satu baris di buku saldo yang **hanya ditambah**, tidak pernah diubah atau dihapus.
  Jenis: `deposit`, `hold`, `hold_release`, `usage`, `adjustment` (koreksi admin, wajib alasan, masuk audit log),
  `refund`.
- Saldo tersedia = saldo − total tahanan aktif. Kolom saldo ringkas per pengguna boleh ada untuk kecepatan, tetapi
  diperbarui dalam transaksi DB yang sama dengan baris buku saldonya, dengan penguncian baris agar dua request
  bersamaan tidak memakai saldo yang sama.
- Pemeriksaan berkala: saldo ringkas = jumlah buku saldo. Selisih → peringatan admin.

## 9. Tahan lalu potong

**Teks dan media sinkron (usulan):**

1. Sebelum memanggil Surplus, tahan estimasi maksimal: `token_input_estimasi × harga_input + batas_output ×
   harga_output`. `batas_output` = `max_tokens` dari pengguna, atau 4096 bila kosong (sama dengan default estimasi
   Surplus [S26]), dibatasi `max_completion_tokens` model. Estimasi token input: **diputuskan owner 2026-11-12:
   byte body JSON ÷ 4, dibulatkan ke atas** (request bergambar base64 menahan lebih besar dari biaya nyatanya).
2. Saldo tersedia kurang dari tahanan → tolak sebelum memanggil Surplus.
3. Setelah respons: potong tagihan nyata (§7), lepas sisa tahanan, dalam satu transaksi.
4. Tagihan nyata melebihi tahanan (mis. estimasi input meleset) → tetap dipotong penuh; saldo boleh negatif kecil, dan
   request berikutnya ditolak sampai saldo positif.
5. Streaming tanpa `usage` di akhir → potong sebesar tahanan sementara, tandai `cost_pending`, lalu koreksi dari
   `GET /v1/requests/{id}` (token dan biaya) saat rekonsiliasi [S8].

**Video dan musik:** saat submit, tahan biaya maksimal yang dihitung dari harga jual; Surplus sendiri menahan
`max_cost_usdc` [S24]. Saat job selesai, potong sesuai hasil; job `failed`/`canceled`/`expired` → lepas tahanan,
tidak ditagih (Surplus juga tidak menagih [S24]). Rumus harga jual per job: **belum dibuktikan**, menunggu uji (§7.3).

## 10. Rekonsiliasi dengan Surplus

Per request nbytes menyimpan: id request Surplus (`x-request-id`), model, token, tagihan ke pengguna, biaya Surplus
(`buyer_cost_micro`, boleh kosong), status biaya (`known` / `pending`).

1. Biaya kosong **tidak pernah** dianggap 0 [S8]. Pekerjaan berkala mengambil `GET /v1/requests/{id}` untuk request
   `pending` (perhatikan batas 60/menit untuk pembacaan terfilter [S2]).
2. Harian: jumlah biaya Surplus per hari dicocokkan dengan log `GET /v1/requests` (atau ekspor CSV, maks 50.000 baris
   [S8]). Selisih → peringatan admin.
3. Margin per request = tagihan − biaya. Margin negatif → peringatan admin dengan model dan id request.
4. Saldo nbytes di Surplus dipantau (`GET /v1/payments/balance`, `credit_balance_usdc`); auto top-up dan peringatan
   `buyer.balance_low` dinyalakan [S2]. Saldo Surplus habis → semua request gagal `402`, jadi ambang peringatan harus
   di atas pemakaian beberapa jam.

## 11. Dampak ke UI (dikerjakan terpisah)

| Halaman | Perubahan yang dibutuhkan |
|---|---|
| Billing pengguna | Dari invoice pascabayar menjadi: saldo USD, tombol deposit (rupiah), riwayat deposit, riwayat pemakaian |
| Model & harga (admin) | Dasar hitungan dari "biaya upstream" mock ke harga list Surplus; markup default 0%; peringatan perubahan harga list |
| Keuangan (admin) | Deposit IDR + kurs yang dipakai, pendapatan (tagihan), biaya Surplus, margin, saldo nbytes di Surplus |
| Admin baru: Kurs | Isi kurs, riwayat, siapa mengubah |

## 12. Model data (usulan, final di PRD tabel/migrasi)

| Tabel | Isi utama |
|---|---|
| `exchange_rates` | `idr_per_usd`, `set_by` (admin), `created_at`; baris terbaru = berlaku |
| `deposits` | `user_id`, `amount_idr`, `fee_idr`, `idr_per_usd`, `credit_micros`, `status` (`pending`/`paid`/`failed`/`expired`), `sumopod_payment_id` (unik), `payment_link_url`, `provider_fee_idr`, `net_amount_idr`, `payment_method`, `expires_at`, `paid_at` |
| `payment_webhook_events` | `svix_id` (unik), `event_type`, `payment_id`, waktu diterima, hasil proses |
| `balance_ledger` | `user_id`, `kind`, `amount_micros` (+/−), rujukan (`deposit_id`/`request_id`), `created_at` |
| `user_balances` | `user_id`, `balance_micros`, `held_micros` (ringkas, dijaga sama dengan buku saldo) |
| `model_prices` | `model_id`, harga jual per komponen (mikrodolar), harga list terakhir, `markup_bp`, `active` |
| `gateway_requests` | id Surplus, `user_id`, model, token, `charge_micros`, `surplus_cost_micros` (nullable), `cost_status` |

Indeks wajib pada foreign key. Migrasi dibuat dengan `npm run db:generate` dan ditinjau sebelum dijalankan.

## 13. Keputusan turunan dari owner

Semua butir di bawah sudah diputuskan (2026-11-11). Owner memutuskan B1, B3 dan B8 langsung, dan menerima
rekomendasi untuk B2, B4, B5, B6, B7 dan B9 ("sesuai rekomendasimu yang penting sesuai dan aman dan cuan").

| # | Pertanyaan | Keputusan |
|---|---|---|
| B1 | Penyedia pembayaran IDR? | **Diputuskan owner: Sumopod Managed Payment** (§6.3). |
| B8 | Metode Sumopod: `QRIS` (cair 2 hari, 0,7% + Rp 300) atau `QRIS_INSTANT` (cair 0 hari, 1,5% + Rp 300)? | **Diputuskan owner: `QRIS`** (2026-11-11). Lebih murah; saldo pengguna tetap masuk saat `payment.completed`, yang tertunda hanya pencairan ke nbytes. |
| B9 | Webhook gagal hanya bisa dikirim ulang manual dan docs tidak menyebut API cek status pembayaran. | **Diputuskan (rekomendasi):** admin mendapat daftar deposit `pending` yang sudah lewat `expires_at` untuk dicocokkan manual dengan tab Payments/Webhooks Sumopod (lalu "resend" webhook di sana, bukan kredit manual). Tanyakan ke Sumopod apakah ada API cek status; bila ada, ganti dengan pengecekan otomatis. |
| B2 | Batas deposit minimal dan maksimal (rupiah)? | **Diputuskan (rekomendasi diterima owner): min Rp 50.000, maks Rp 10.000.000**, bisa diatur admin. Alasan min: di bawah ±Rp 13.000 biaya tetap Sumopod Rp 300 membuat biaya 3% tidak cukup (rugi); di Rp 50.000 sisa ±Rp 839. Maks: batas per transaksi QRIS di Sumopod **tidak terdokumentasi**; turunkan bila Sumopod menolak. |
| B3 | Biaya deposit? | **Diputuskan owner: 3%** (§6.2), bisa diatur admin. |
| B4 | Selisih aman di kurs admin? | **Diputuskan (rekomendasi): kurs admin = kurs pasar + 4%** sebagai awal. Menutup biaya Stripe yang dipotong Surplus saat nbytes top-up kartu (perkiraan 2,9% + $0,30 per top-up [S2]) dan selisih kurs bank (besarnya **belum dibuktikan**). Ditinjau bulanan dengan biaya nyata: rupiah yang keluar ÷ USD kredit Surplus yang diterima. Halaman admin kurs menampilkan angka ini. |
| B5 | Refund saldo? | **Diputuskan (rekomendasi):** saldo yang sudah masuk tidak bisa diuangkan kembali, kecuali (a) pembayaran tertagih tetapi saldo tidak masuk, (b) tertagih ganda, atau (c) diwajibkan hukum. Diproses admin manual, tercatat sebagai `refund` di buku saldo dan audit log. Sejalan dengan Surplus yang tidak merefund kredit setelah 24 jam (Terms §4.2 [S14]). Wajib tertulis di syarat layanan nbytes; kesesuaian dengan hukum perlindungan konsumen Indonesia **belum dibuktikan** (perlu ditinjau ahli hukum). |
| B6 | Hapus akun dengan saldo tersisa? | **Diputuskan (rekomendasi):** popup konfirmasi menampilkan jumlah saldo dan menyatakan saldo hangus (sesuai B5). Hapus akun **ditolak** selama ada deposit `pending`, tahanan saldo aktif, job video/musik berjalan, atau saldo negatif. Mengubah alur di `PRD/account-settings.md` S5. |
| B7 | Saldo negatif kecil (§9 butir 4) diizinkan? | **Diputuskan (rekomendasi): ya**, hanya dari selisih satu request yang melampaui tahanan; request berikutnya ditolak sampai saldo positif lagi. |

## 14. Belum dibuktikan

- Field token cache di respons chat, bentuk `usage` embeddings/audio, dan cara Surplus menghitung unit TTS/STT.
- Apakah harga katalog `GET /v1/models` sama dengan harga referensi lantai diskon (`ai-gateway.md` §6.1).
- Cara mengaitkan job video/musik dengan baris `GET /v1/requests` untuk rekonsiliasi.
- Semuanya diuji setelah nbytes punya key Surplus (D10 di `ai-gateway.md`).
- Sumopod: base URL **Live** tidak terdokumentasi (hanya Sandbox `api-pay-sandbox.sumopod.com`); keunikan `order_id`;
  API cek status pembayaran; retry otomatis webhook; field tambahan "custom checkout page". Belum dibuktikan.
- Sumopod, **sudah dibuktikan** di Sandbox (2026-11-11, satu deposit Rp 50.000 lewat backend nbytes): kode metode
  `"QRIS"` diterima; nilai respons QRIS (§6.3 Catatan); pembulatan biaya ke atas (§6.2); webhook `payment.completed`
  bertanda tangan svix lolos verifikasi dan saldo dikreditkan sekali; Resend memakai `svix-id` baru dan tidak
  mengkreditkan ulang (§6.3).

## 15. Sumber

- `PRD/ai-gateway.md` (S1–S32) untuk semua fakta Surplus.
- Kode: `src/lib/server/db/schema/auth.ts`, `src/components/dashboard/billing/billing-copy.ts`,
  `src/components/dashboard/billing/billing-data.ts`, `src/components/admin/billing/billing-data.ts`,
  `src/components/admin/models/models-data.ts`.
- PRD: `PRD/backend-auth-admin.md` Lampiran A.8, `PRD/account-settings.md` S5.
- Sumopod (dibaca 2026-11-11):

| Kode | Sumber |
|---|---|
| P1 | https://docs.sumopod.com/guides/managed-payment/create-managed-payment |
| P2 | https://docs.sumopod.com/guides/managed-payment/integrate-managed-payment |
| P3 | https://docs.sumopod.com/guides/managed-payment/configure-payment-settings |
| P4 | https://docs.sumopod.com/guides/managed-payment/withdraw-balance |
| P5 | https://docs.sumopod.com/guides/managed-payment/go-live |
| P6 | Tangkapan layar dashboard Sumopod, Quick Start: field create, metode dan biaya |
| P7 | Tangkapan layar dashboard Sumopod, Quick Start: contoh respons create |
| P8 | Tangkapan layar dashboard Sumopod, Quick Start: event dan payload webhook, aturan 2xx/10 detik |
| P9 | Tangkapan layar dashboard Sumopod, Quick Start: verifikasi tanda tangan svix (contoh Node.js) |
| P10 | Tangkapan layar dashboard Sumopod, Quick Start: verifikasi `X-Webhook-Token` |
| P11 | Tangkapan layar dashboard Sumopod, Settings → Webhook |
| P12 | Tangkapan layar dashboard Sumopod, Settings → Redirect URLs |
| P13 | Tangkapan layar dashboard Sumopod, Settings → Fee Settings |
| P14 | Tangkapan layar dashboard Sumopod, Settings → Checkout Settings |
| P15 | Tangkapan layar dashboard Sumopod, Supported Payment Methods + konfirmasi owner "hanya itu saja channelnya" |

P6–P10 dikirim owner sebagai berkas di folder `sumopod/` dan P11–P15 lewat chat, semuanya 2026-11-11 (mode Sandbox).
Isinya sudah disalin ke §6.3, sehingga berkas gambarnya boleh dihapus.
