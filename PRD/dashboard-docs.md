# PRD: Halaman API Docs (dashboard pengguna) disesuaikan dengan API yang sudah dibangun

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima. **Dibangun** 2026-11-12; klaim E2–E10, E15 diuji terhadap API yang berjalan (DB lokal, Surplus tiruan, curl). Koreksi saat membangun: "request gagal tidak ditagih" dipersempit, karena stream yang terputus di tengah tetap ditagih (`stream-proxy.ts`). Belum dicek di browser |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/docs`: isi referensi disamakan dengan API yang benar-benar berjalan (`/api/v1/chat/completions`, `/api/v1/models`, `/api/v1/models/{id}`), base URL asli, kode error asli, streaming, batas, penagihan; penyetelan desain |
| Di luar cakupan | Endpoint yang belum dibangun (`/completions`, `/responses`, Anthropic, embeddings, gambar, audio, video: gateway-api §15a), Docs publik tanpa login, landing page |
| Bergantung pada | `PRD/gateway-api.md` §4–§10 (aturan API), kode di `src/lib/gateway/*-contract.ts` dan `src/lib/server/gateway/` |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Docs adalah halaman statis (tidak membaca database). Tampilannya sudah baik: dua kolom penjelasan + contoh, daftar isi di layar lebar, contoh dalam tiga bahasa. Masalahnya ada di **isi**: ditulis sebelum backend ada, dan sekarang beberapa bagiannya **salah** terhadap API yang sudah dibangun hari ini (§2.2). Pengguna yang mengikuti Docs akan salah membaca respons error dan daftar model.

Pekerjaan utama halaman ini adalah koreksi isi, bukan sambungan data. Satu-satunya data dari server adalah base URL (`APP_URL` + `/api/v1`, pola yang sudah dipakai Playground).

---

## 2. Kondisi saat ini (bukti dari kode)

### 2.1 Mockup frontend

| Bagian | Isi | File |
|---|---|---|
| Header | Judul, lead, lencana "Versi v1 · Format OpenAI · JSON lewat HTTPS", catatan "Draf… sampai backend tersambung" | `docs-view.tsx`, `docs-copy.ts` |
| Base URL dan autentikasi | Base URL contoh `https://api.example.com/v1`, header `Authorization: Bearer $NBYTES_API_KEY` | `docs-reference.ts` |
| Chat completion | `POST /chat/completions`, 5 parameter, contoh request 3 bahasa (`build-snippet.ts`), contoh respons | `docs-reference.ts`, `request-example.tsx` |
| Daftar model | `GET /models`, 2 field (`id`, `owned_by`), contoh respons | `docs-reference.ts` |
| Kode error | 5 baris (400, 401, 402, 429, 502), contoh body error | `docs-reference.ts` |
| Daftar isi | 4 tautan, layar ≥ xl | `docs-view.tsx` |
| Route | `docs/page.tsx` merender `<DocsView />` tanpa data | — |

### 2.2 Isi yang salah atau kurang dibanding API asli

| # | Docs sekarang | API asli (bukti) | Akibat bagi pengguna |
|---|---|---|---|
| E1 | Base URL `https://api.example.com/v1` | `<origin APP_URL>/api/v1` (A1 diputuskan; domain produksi **belum diputuskan**) | Contoh tidak jalan |
| E2 | `owned_by` = provider, contoh `"openai"` | `owned_by: "nbytes"` selalu; field lain: `created`, `name`, `context_length`, `pricing.prompt`, `pricing.completion` (USD per token, string 12 desimal) (`catalog.ts` `toPublic`, `catalog-contract.ts` `PublicModel`) | Pengguna mengira bisa menyaring provider; harga di respons tidak dijelaskan |
| E3 | "400: Body tidak valid atau model tidak dikenal" | Model tidak dikenal/nonaktif = **404** `model_not_found` (`chat-completions.ts`) | Penanganan error salah |
| E4 | 402 hanya "batas anggaran bulanan key" | 402 juga `insufficient_balance` (saldo kurang); batas key = `key_budget_exceeded` (`error-contract.ts`) | Pengguna tidak tahu harus isi saldo |
| E5 | Tidak ada 403, 404, 413, 503 | `account_suspended` 403, `model_not_found` 404, `request_too_large` 413, `service_unavailable` / `model_unavailable` 503 | Error tidak terdokumentasi |
| E6 | Contoh body error: `message` bahasa Indonesia, hanya `message` + `type` | `{"error":{"type","code","message","param"}}`, pesan bahasa Inggris (`openAiErrorBody`) | Pengguna membaca field yang tidak ada / melewatkan `code` |
| E7 | Tidak ada | Header `x-api-key` juga diterima selain Bearer; key berawalan `nbk_` (`readApiKey`) | — (tambahan) |
| E8 | Tidak ada | Rate limit **120 request/menit per key**, jawaban `429` dengan header `Retry-After` (`public-api.ts`) | Pengguna tidak tahu batasnya |
| E9 | Tidak ada | Setiap respons membawa `x-request-id` (id nbytes) (`gatewayJson`, `stream-proxy.ts`) | Pengguna tidak tahu id apa yang dilaporkan ke support |
| E10 | `stream` dijelaskan singkat | Saat streaming, server selalu menambah `stream_options.include_usage = true`, jadi event terakhir berisi `usage` (`chat-contract.ts`) | Pengguna tidak tahu dari mana angka token |
| E11 | `max_tokens` saja | `max_completion_tokens` juga diterima dan didahulukan (`chat-contract.ts`) | — (tambahan) |
| E12 | Field lain tidak disebut | Field selain yang dicek diteruskan apa adanya, kecuali field routing (`provider`, `provider_url`, `provider_base_url`, `providers_blocked`, `provider_order`, `si_route`, `min_discount_pct`) yang dibuang (`ROUTING_FIELDS`) | Pengguna bisa mengira field routing berlaku |
| E13 | Tidak ada | Body maks 10 MB (`MAX_JSON_BODY_BYTES`); gambar ke model tanpa dukungan gambar ditolak 400 sebelum ditagih | — |
| E14 | "Biaya dihitung dari token yang benar-benar dipakai" | Benar, ditambah: saldo **ditahan** dulu sebesar perkiraan, lalu ditagih sesuai usage; request gagal tidak ditagih (`settleFailure` charge 0, `holdForRequest`) | Pengguna bingung saat saldo "tertahan" |
| E15 | `GET /models/{id}` tidak ada | Ada, dengan key, 404 untuk id di luar katalog aktif termasuk alias (`models/[id]/route.ts`) | — (tambahan) |
| E16 | Catatan "Draf… sampai backend tersambung" | Backend chat dan models sudah berjalan (gateway-api §15a), tapi baru diuji dengan Surplus tiruan | Catatan perlu diganti, bukan dihapus begitu saja (§10 C1) |
| E17 | Contoh respons chat ditulis tangan | Respons diteruskan dari Surplus setelah dibersihkan (`stripUpstream`); bentuk asli dari Surplus **belum dibuktikan** dengan request nyata | Contoh tetap ditandai "contoh" |

### 2.3 Temuan desain

| # | Temuan |
|---|---|
| T1 | Lencana metode `POST` memakai `bg-app-accent-soft text-app-accent-text`: accent bukan untuk dekorasi (dashboard-design §3) |
| T2 | Label "wajib" di daftar parameter memakai `text-app-accent-text`, bukan tautan atau aksi |
| T3 | Kode status di daftar error semuanya `text-app-danger`, juga untuk 429 yang bukan kesalahan fatal |
| T4 | Daftar error (`ErrorList`) berupa `dl`: cukup untuk 5 baris, padat untuk 11 kode (E5) |
| T5 | Daftar isi tidak menandai bagian yang sedang dibaca | Tambahan, bukan kesalahan |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Isi |
|---|---|---|
| F1 | Base URL asli | `authEnv().appOrigin` + `/api/v1`, juga di semua contoh kode |
| F2 | Autentikasi | Bearer atau `x-api-key`, format `nbk_…`, simpan di server; tautan ke API Keys |
| F3 | Chat completion | Parameter yang dicek nbytes (`model`, `messages`, `stream`, `max_tokens` / `max_completion_tokens`, `stream_options`), catatan bahwa field lain diteruskan dan field routing dibuang (E12), batas 10 MB, gambar |
| F4 | Streaming | Bagian sendiri: SSE, `data: [DONE]`, event `usage` terakhir (E10), contoh cURL `-N` |
| F5 | Daftar model | `GET /models` dan `GET /models/{id}` dengan field asli (E2, E15); tautan ke halaman Models |
| F6 | Kode error | `error-contract.ts` punya 13 kode; Docs menampilkan 11 (tanpa `unauthorized` dan `forbidden` yang khusus Playground), bentuk body asli (E6), `Retry-After` |
| F7 | Batas dan penagihan | Rate limit 120/menit per key (E8); tahan lalu tagih, request gagal tidak ditagih, batas bulanan key (E14) |
| F8 | `x-request-id` | Satu paragraf: id ini yang dilaporkan bila ada masalah (E9) |
| F9 | Satu sumber data | Daftar kode error dibangkitkan dari `error-contract.ts` (status + kode) dengan teks Indonesia di Docs, supaya tidak bisa berbeda lagi |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Penanda bagian aktif di daftar isi | Orientasi di halaman panjang | Kecil, `IntersectionObserver` di klien |
| R2 | Contoh SDK Anthropic | Permukaan Anthropic **belum dibangun** (fase 3) | Tidak sekarang |
| R3 | Docs bisa dibuka tanpa login | Calon pengguna bisa membaca sebelum daftar | Mengubah proxy dan layout (halaman ada di grup dashboard); menyentuh area di luar dashboard. Tidak sekarang |

---

## 4. Isi halaman

Urutan bagian (usulan): Base URL dan autentikasi → Chat completion → Streaming → Daftar model → Kode error → Batas dan penagihan. Daftar isi ikut urutan ini.

Catatan di header (E16) diganti: "API mengikuti format OpenAI. Endpoint yang tersedia: chat completions dan models. Endpoint lain menyusul."

---

## 5. Data dan server

- `docs/page.tsx` menjadi Server Component yang membaca `authEnv().appOrigin` dan meneruskan base URL ke `DocsView`. Tidak ada query database.
- Kode error: Docs mengambil daftar status dari `SPECS` di `src/lib/gateway/error-contract.ts` (perlu diekspor sebagai daftar baca-saja) dan memasangkan teks Indonesia per kode di `docs-copy.ts`. Kode tanpa teks Indonesia gagal di test, jadi kode baru tidak bisa terlewat.
- Angka batas (120/menit, 10 MB) diambil dari konstanta kode bila sudah diekspor (`MAX_JSON_BODY_BYTES` sudah diekspor; `RATE_LIMIT` di `public-api.ts` belum, perlu dipindah ke kontrak client-safe).
- Tidak ada endpoint baru.

---

## 6. Keamanan

| Hal | Aturan |
|---|---|
| Rahasia di contoh | Contoh selalu memakai `$NBYTES_API_KEY`, tidak pernah key asli |
| Detail upstream | Docs tidak menyebut Surplus, harga list, atau markup (gateway-api §1.3) |
| `APP_URL` | Bukan rahasia; tampil sebagai teks |

---

## 7. Penyetelan desain (usulan Claude)

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | Lencana `POST` accent-soft, `GET` netral | Keduanya netral (`bg-app-inset` + `border-app-border`), dibedakan teksnya | T1 |
| D2 | "wajib" berwarna accent | "wajib" `text-app-text font-medium`, "opsional" `text-app-text-3` | T2 |
| D3 | Semua kode status merah | 4xx karena request pengguna: `app-warning`; 5xx: `app-danger`; selalu dengan kode dan kalimat | T3; warna status selalu disertai kata |
| D4 | Daftar error `dl` | `Table` dari `app-kit` (Status, Kode, Arti, Yang dilakukan) di area lebar, karena 11 baris; contoh body tetap di kolom contoh | T4; dashboard-design §6: tabel untuk data |
| D5 | Lencana fakta "Versi v1 · Format OpenAI · JSON lewat HTTPS" | Tetap | — |
| D6 | Contoh respons tanpa keterangan | Judul blok "Contoh respons" | E17 |

Semua token yang dipakai sudah diukur di dashboard-design §3; tidak ada token baru.

---

## 8. Dampak ke bagian lain

| Bagian | Dampak |
|---|---|
| `shared/build-snippet.ts` | Dipakai Docs dan Quick Start; base URL sekarang datang dari server di keduanya |
| `model-catalog.ts` `BASE_URL` | Setelah Docs dan Quick Start dibangun, tidak ada pemakai di dashboard. Landing tetap memakainya (`landing/agents/agents-data.ts`, `landing/shared/landing-mock-data.ts`, dicek dengan grep), jadi `BASE_URL` **tidak dihapus**; landing di luar cakupan |
| `error-contract.ts` | Tambah ekspor daftar baca-saja; perilaku API tidak berubah |
| `public-api.ts` | Konstanta rate limit dipindah ke kontrak supaya Docs bisa membacanya; nilai tidak berubah |

---

## 9. Lokasi file

```
src/
  app/(dashboard)/docs/page.tsx                     base URL dari server
  components/dashboard/docs/
    docs-view.tsx                                   bagian baru (Streaming, Batas), tabel error, desain §7
    docs-reference.ts                               isi dikoreksi (§2.2)
    docs-copy.ts                                    teks baru, teks Indonesia per kode error
    doc-section.tsx, param-list.tsx                 desain D1, D2
    request-example.tsx                             base URL dari props
    docs-errors.test.ts                             baru: setiap kode error punya teks
  lib/gateway/error-contract.ts                     + ekspor daftar
  lib/gateway/rate-limit-contract.ts (atau sejenis) baru: konstanta rate limit publik
```

`components/dashboard/docs/` akan berisi 7 file. Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| C1 | Ganti catatan "Draf" dengan kalimat di §4? | Ya |
| C2 | Urutan bagian §4, termasuk bagian baru Streaming dan Batas dan penagihan? | Ya |
| C3 | Jelaskan "saldo ditahan dulu lalu ditagih sesuai pemakaian" di Docs (E14)? | Ya, tanpa angka rumus tahanan |
| C4 | R1 penanda bagian aktif? | Ya, kecil |
| C5 | R2 Anthropic, R3 Docs publik? | Tidak sekarang |
| C6 | Penyetelan desain D1–D6 (§7)? | Diterima semua |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit
- Setiap kode di `error-contract.ts` (kecuali kode Playground) punya teks Indonesia di Docs.
- `buildSnippet` memakai base URL yang diberikan (test yang ada diperluas).

### 11.2 Integrasi (dev server, Surplus tiruan)
- Contoh cURL dari halaman, dengan key uji: `GET /models` → 200, `POST /chat/completions` → 200, model nonaktif → 404 dengan body persis seperti contoh error di Docs.
- Halaman tidak memuat `api.example.com` atau kata "Draf".

### 11.3 Kriteria penerimaan
- [ ] Setiap baris di tabel §2.2 tertangani.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/components/dashboard/docs/*` (6 file) | isi dan tampilan sekarang | Dibaca |
| `src/lib/gateway/error-contract.ts` | 13 kode, status, bentuk body | Dibaca |
| `src/lib/gateway/chat-contract.ts` | field yang dicek, `ROUTING_FIELDS`, `include_usage`, 10 MB | Dibaca |
| `src/lib/gateway/keys/api-key-contract.ts` | `nbk_`, Bearer atau `x-api-key` | Dibaca |
| `src/lib/server/gateway/public-api.ts` | 120/menit per key, `x-request-id`, `Retry-After` | Dibaca |
| `src/lib/server/gateway/catalog.ts`, `src/lib/gateway/catalog-contract.ts` | bentuk `PublicModel`, `owned_by: "nbytes"` | Dibaca |
| `src/lib/server/gateway/chat/chat-completions.ts`, `upstream-outcome.ts` | 404 model, gagal tidak ditagih | Dibaca |
| `src/app/api/v1/models/[id]/route.ts` | endpoint per model | Dibaca |
| `PRD/gateway-api.md` A1, §15a | path diputuskan, domain belum, endpoint yang belum dibangun | Dibaca |
| Bentuk respons chat asli dari Surplus | — | **Belum dibuktikan** |
| Domain produksi | — | **Belum diputuskan** owner |
