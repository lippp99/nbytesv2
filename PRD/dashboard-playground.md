# PRD: Halaman Playground (dashboard pengguna) tersambung ke backend

| | |
|---|---|
| Status | v1, disetujui owner 2026-11-12 ("Setuju semua"): semua usulan §10 diterima, termasuk P3 (c). **Dibangun** 2026-11-12 (lokasi file sebenarnya di §9); uji integrasi §11.2 lolos di DB lokal dengan Surplus tiruan lewat curl. Belum diuji dengan Surplus asli dan belum dicek di browser |
| Tanggal | 2026-11-12 |
| Repo / branch | `nbytesv2` / `develop` |
| Cakupan | `/playground`: chat sungguhan ke model aktif lewat sesi login (A5), streaming, biaya per giliran dari saldo, tab Kode dengan base URL asli, penyetelan desain |
| Di luar cakupan | Input gambar/file, menyimpan percakapan, berbagi percakapan, membandingkan dua model berdampingan, endpoint selain chat completions, landing page |
| Bergantung pada | `PRD/gateway-api.md` §7, §8, §11 dan keputusan **A5** ("Playground lewat sesi login dan menagih saldo: ya"), `PRD/gateway-pricing-billing.md` §9 |

Aturan baca: setiap klaim tentang kode berasal dari file yang dibuka saat PRD ini ditulis (§12). Yang tidak bisa dibuktikan ditandai **belum dibuktikan**. Bagian **usulan** adalah rekomendasi yang bisa diganti owner.

---

## 1. Ringkasan

Playground sudah punya tampilan lengkap: area chat lebar, panel parameter, tab Kode berisi `curl`. Semua jawabannya contoh: balasan muncul lewat `setTimeout` dengan teks "Mode demo…", token ditebak dari jumlah karakter, dan model dari katalog contoh.

Backend chat sudah ada untuk API publik (`POST /api/v1/chat/completions`: tahan saldo, panggil Surplus, streaming, tagih, catat). Yang belum ada: pintu masuk lewat **sesi login** tanpa key API, seperti yang sudah diputuskan di A5. PRD gateway-api §11 mengusulkan `POST /api/playground/chat`; §15a mencatat Playground "belum dibangun".

Tujuan: pengguna mencoba model aktif sungguhan, melihat token dan biaya asli tiap giliran, lalu menyalin request yang sama sebagai `curl`.

---

## 2. Kondisi saat ini (bukti dari kode)

### 2.1 Mockup frontend

| Bagian | Isi sekarang | File |
|---|---|---|
| Route | `playground/page.tsx` merender `<PlaygroundView />` tanpa data | — |
| Area kerja | Header (logo model, nama, "Sesi N tok · $X", Chat/Kode, Bersihkan), log chat, composer | `playground-view.tsx` |
| Jawaban | `setTimeout` 900 ms, teks `copy.reply(...)` "Mode demo…" | `use-playground.ts` |
| Token dan biaya | `estimateTokens` = karakter ÷ 4 (`shortcut:` di kode), biaya dari harga contoh | `playground-cost.ts` |
| Stop | Hanya `clearTimeout` | `use-playground.ts` |
| Model | `mockModels` (12 contoh), default `mockModels[0]` | `settings-panel.tsx`, `use-playground.ts` |
| Info model | Logo + provider + konteks + harga | `settings-panel.tsx` (`ModelFacts`) |
| Parameter | System prompt, temperature 0–2 (langkah 0,1), max tokens 64–4096 (langkah 64) | `settings-panel.tsx` |
| Tab Kode | `curl` ke `BASE_URL` = `https://api.example.com/v1` (contoh) | `playground-request.ts`, `model-catalog.ts` |
| Avatar pengguna | Inisial dari `account.userName` contoh ("Rina Wulandari") | `chat-log.tsx` |
| Kosong | Ikon di kotak `bg-app-accent-soft`, judul, 3 saran prompt | `chat-log.tsx` |
| Test | `playground-cost.test.ts`, `playground-request.test.ts` | — |

### 2.2 Backend yang ada

| Hal | Isi kode | Dampak |
|---|---|---|
| Alur chat | `chatCompletions()`: key → rate limit → baca body (maks 10 MB) → `parseChatBody` → model aktif → cek gambar → tahan saldo → Surplus → tagih → balas | Langkah setelah autentikasi bisa dipakai bersama; hanya pintu masuknya yang beda |
| Tahan saldo | `HoldInput.keyId: string` (wajib), `monthlyBudgetMicros` per key | `keyId` perlu boleh `null` untuk Playground. Kolom `gateway_requests.api_key_id` sudah boleh null |
| Kolom `endpoint` | Diisi `"/v1/chat/completions"` | Usulan: Playground mengisi `"/playground/chat"` agar bisa dibedakan di Usage dan admin |
| Streaming | `streamThrough`: SSE diteruskan apa adanya, event usage dibaca (biaya Surplus dibuang), tagihan diselesaikan sekali | Klien bisa membaca token dari event usage terakhir |
| **Stop di tengah stream** | Pengguna memutus koneksi → `client_disconnected`; **bila usage belum datang, yang ditagih adalah seluruh tahanan** dan biaya ditandai pending (`stream-proxy.ts`, billing §9.5) | Menekan Stop bisa menagih lebih dari pemakaian sebenarnya. Perlu keputusan §10 P3 |
| Tahanan | `holdMicros(byte body, outputCap(max_tokens, maks model), harga)` | Max tokens besar = tahanan besar = butuh saldo lebih |
| Penjaga dashboard | `readGuardedJson`: Origin sama, JSON, **maks 1 KB** | Terlalu kecil untuk riwayat chat; Playground butuh batas sendiri |
| Rate limit publik | 120/menit **per key** (`public-api.ts`) | Playground butuh kunci rate limit per pengguna |
| Gambar | Ditolak sebelum biaya bila model tidak mendukung | v1 tanpa gambar, jadi tidak relevan |
| Uji nyata ke Surplus | gateway-api §15a: "diuji hanya dengan Surplus tiruan" | Bentuk stream asli **belum dibuktikan** |
| Hosting | gateway-api A6 (batas durasi request) **belum diputuskan** | Stream panjang bisa terpotong host; belum diketahui batasnya |
| Katalog di DB lokal | 0 model aktif saat 2026-11-12 (dicek waktu membangun halaman Models) | Playground lokal akan kosong sampai admin mengaktifkan model |

### 2.3 Temuan desain dari mockup

| # | Temuan |
|---|---|
| T1 | Kotak ikon kosong memakai `bg-app-accent-soft` + `text-app-accent-text`: ini dekorasi, padahal accent hanya untuk aksi utama, seleksi, tautan (dashboard-design §3) |
| T2 | Logo dan provider di header area kerja, avatar model, dan `ModelFacts` tidak bisa diisi: `model_prices` tidak menyimpan provider (sama dengan PRD Models M1) |
| T3 | Max tokens selalu 64–4096, tidak mengikuti `max_completion_tokens` model |
| T4 | Perkiraan token di composer tampil sebagai angka pasti ("N token") padahal tebakan karakter ÷ 4 |
| T5 | Header area kerja menyebut "tok", singkatan yang tidak dipakai di halaman lain |
| T6 | Jawaban ditampilkan sebagai teks polos (`whitespace-pre-wrap`); model sering menjawab dalam Markdown |

---

## 3. Fitur untuk pengguna

### 3.1 Wajib (v1)

| # | Fitur | Isi |
|---|---|---|
| F1 | Pilih model | Hanya model aktif dari katalog (`listCatalogForUsers`), urut nama. Default: model pertama. Info di bawah: konteks, maks output, harga input/output per 1M |
| F2 | Chat sungguhan dengan streaming | Teks muncul bertahap. Riwayat percakapan + system prompt dikirim tiap giliran |
| F3 | Stop | Memutus stream. Teks yang sudah datang tetap tampil dengan tanda "Dihentikan". Penagihan mengikuti keputusan P3 |
| F4 | Token dan biaya asli per giliran | Dari event usage terakhir; biaya = `chargeMicros(input, output, harga)` (rumus yang sama dengan server). Tanpa usage: "Biaya menyusul" |
| F5 | Total sesi | Token dan biaya semua giliran di header area kerja |
| F6 | Parameter | System prompt, temperature 0–2, max tokens dari 64 sampai maks output model (atau 4096 bila tidak diketahui, sama dengan `DEFAULT_OUTPUT_TOKENS`) |
| F7 | Tab Kode | `curl` yang sama dengan percakapan, base URL dari server (`APP_URL` + `/api/v1`, path A1) |
| F8 | Error yang jelas | Saldo kurang (dengan tautan ke `/billing`), rate limit, model tidak tersedia, sesi habis (ke login), layanan gagal, offline |
| F9 | Identitas | Inisial pengguna dari sesi (`initialsOf`, sama dengan sidebar), menutup sisa keputusan account-settings S6 |
| F10 | Katalog kosong | "Belum ada model yang tersedia. Hubungi admin." Composer nonaktif |
| F11 | Tanpa penyimpanan | Percakapan hanya di memori tab; hilang saat halaman ditinggal. Prompt dan jawaban tidak disimpan server (gateway-api §12) |

### 3.2 Rekomendasi tambahan (usulan, butuh keputusan §10)

| # | Fitur | Alasan | Biaya |
|---|---|---|---|
| R1 | Tampilkan jawaban sebagai Markdown (judul, daftar, blok kode) | T6: jawaban model lebih terbaca | Butuh library baru (mis. `react-markdown`) atau parser sendiri; harus aman dari HTML mentah. Belum ada di `package.json` (**belum dicek versi/ukuran**) |
| R2 | Perkiraan biaya maksimum sebelum kirim ("Ditahan sampai $X") | Pengguna tahu kenapa saldo kurang | Kecil: `holdMicros` sudah fungsi murni di `lib/gateway/price-math.ts` |
| R3 | Salin satu jawaban | Sudah ada tombol salin di `chat-log.tsx` | 0 |
| R4 | Ulangi jawaban terakhir (regenerate) | Uji ulang dengan parameter baru | Kecil di klien; tetap menagih |

---

## 4. Isi halaman

Pola dashboard-design §6 "Work area": area kerja paling lebar; kode panjang dibuka di area lebar (tab Kode), tidak di kolom samping.

| Keadaan | Perilaku |
|---|---|
| Memuat | Skeleton area kerja + panel parameter |
| Katalog kosong | F10 |
| Menunggu token pertama | Skeleton baris jawaban (sudah ada) |
| Streaming | Teks bertambah; tombol Kirim menjadi Stop; scroll mengikuti jawaban |
| Selesai | Baris token + biaya di bawah jawaban |
| Dihentikan | Teks parsial + "Dihentikan" + biaya sesuai P3 |
| Saldo kurang (`402 insufficient_balance`) | Pesan di atas composer: "Saldo tidak cukup untuk request ini." + tautan "Isi saldo". Pesan pengguna tetap di composer |
| Rate limit (`429`) | "Terlalu banyak request. Coba lagi dalam N detik." |
| Model dimatikan admin (`404 model_not_found`) | "Model ini tidak tersedia lagi. Pilih model lain." |
| Sesi habis | Ke `/login?next=%2Fplayground` |
| Gagal lain | "Model belum bisa menjawab. Coba lagi." Tidak ditagih (alur §9 gateway) |

---

## 5. Server

### 5.1 Endpoint baru `POST /api/playground/chat`

| Langkah | Aturan |
|---|---|
| 1. Penjaga | Origin = `APP_URL`, `Content-Type: application/json`, ukuran body maks **256 KB** (usulan, §10 P4) |
| 2. Sesi | `readSession()`; tidak ada → 401 |
| 3. Rate limit | Per pengguna, kunci `gateway:playground:<userId>`, **20 request/menit** (usulan, §10 P5) |
| 4. Validasi | Kontrak baru `playground-contract.ts`: `model` (string), `messages` (1–200, batas usulan; role `system`/`user`/`assistant`, `content` string saja), `temperature` 0–2, `max_tokens` bilangan bulat positif. Field lain ditolak. Server sendiri yang memasang `stream: true` |
| 5–10. | Sama dengan `chatCompletions`: model aktif, tahan saldo (`keyId: null`, tanpa batas key), Surplus, streaming, tagih, catat. `endpoint = "/playground/chat"` |

Refaktor: bagian langkah 5–10 `chatCompletions` dipisah menjadi fungsi bersama yang menerima pemilik (`userId`, `keyId | null`, batas). API publik dan Playground memanggil fungsi yang sama, bukan salinan.

Bentuk error: amplop OpenAI yang sudah dipakai gateway (`gatewayErrorResponse`), supaya klien hanya membaca satu bentuk. Kode untuk sesi tidak ada belum ada di `GatewayErrorCode`; nama kodenya ditentukan saat implementasi (usulan: `unauthorized`, 401).

### 5.2 Halaman

`playground/page.tsx` (Server Component): `getCurrentUser()`, `listCatalogForUsers()`, base URL dari `APP_URL`, lalu kirim ke `PlaygroundView` (client). Nama/inisial pengguna dari sesi.

### 5.3 Client

`src/lib/playground-client.ts`: `streamChat(body, signal)` yang membaca SSE (`data: {...}` per baris, `[DONE]` di akhir), memanggil callback per potongan teks, dan mengembalikan usage terakhir atau error yang sudah dipetakan. Komponen tidak memanggil `fetch` langsung.

---

## 6. Keamanan dan uang

| Risiko | Kontrol |
|---|---|
| CSRF memakai saldo pengguna | Origin wajib sama, JSON wajib, cookie `SameSite=Lax`, hanya `POST` |
| Body besar untuk menaikkan tahanan atau membebani server | Batas 256 KB sebelum parsing |
| Menyelundupkan field routing Surplus | Kontrak hanya menerima field yang disebut di §5.1 |
| Pemakaian berlebihan | Rate limit per pengguna + tahanan saldo yang sama dengan API |
| Tagihan Stop | Lihat P3 |
| Log | Prompt dan jawaban tidak ditulis ke log atau database |
| Base URL | `APP_URL` bukan rahasia; dikirim sebagai teks ke klien |

---

## 7. Penyetelan desain (usulan Claude)

| # | Sekarang | Usulan | Alasan |
|---|---|---|---|
| D1 | Kotak ikon kosong `bg-app-accent-soft` + ikon accent | Kotak `bg-app-inset` + ikon `text-app-text-2` | T1 |
| D2 | Logo provider di header, avatar model, dan info model | Dihapus; avatar model berisi huruf awal nama model di kotak netral; info model: konteks, maks output, harga | T2 |
| D3 | Slider max tokens 64–4096 | Batas atas = maks output model (F6); nilai yang lebih besar dipotong saat ganti model, dengan teks kecil "Dibatasi maks output model" | T3 |
| D4 | Composer: "N token" | "≈ N token (perkiraan)" | T4: jujur bahwa ini tebakan |
| D5 | Header: "Sesi N tok · $X" | "Sesi ini: N token · $X" | T5 |
| D6 | Biaya per giliran tanpa status | "N masuk · N keluar · $X" bila usage ada; "Biaya menyusul" bila tidak; "Dihentikan" untuk Stop | F3, F4 |
| D7 | Error tidak ada | Pesan di atas composer dengan `role="alert"`, warna `app-danger` + kata; tautan "Isi saldo" berwarna `app-accent-text` (tautan boleh accent) | F8 |
| D8 | Tinggi area kerja tetap `lg:h-176` | Tetap; area kerja Playground adalah satu-satunya kotak yang scroll sendiri (rules §5) | — |

Kontras: tidak ada token baru.

---

## 8. Dampak ke bagian lain

| Bagian | Dampak |
|---|---|
| Usage | Request Playground ikut tercatat dan dihitung (PRD `dashboard-usage.md` T8) |
| Admin Request log | Baris Playground terlihat dengan `endpoint = "/playground/chat"` dan tanpa key |
| `request-billing.ts` | `HoldInput.keyId` menjadi `string | null`; cek batas key dilewati bila `null` |
| `model-catalog.ts` | Tidak diubah (landing, Docs, Quick Start masih memakainya) |
| `dashboard-data.ts` `account` | Tidak dipakai Playground lagi; masih dipakai Quick Start |
| Docs, Quick Start | Masih `BASE_URL` contoh; base URL dari server bisa dipakai juga nanti (di luar cakupan) |

---

## 9. Lokasi file

Dibangun 2026-11-12 (P7 dijalankan):

```
src/
  app/(dashboard)/playground/page.tsx               sesi, katalog, base URL dari APP_URL, inisial
  app/api/playground/chat/route.ts                  POST
  components/dashboard/playground/                  9 file; playground-cost.ts dihapus, estimateTokens pindah
                                                    ke playground-request.ts; + playground-skeleton.tsx
  lib/playground/                                   playground-contract.ts (+ test), sse-reader.ts (+ test),
                                                    playground-client.ts
  lib/gateway/error-contract.ts                     + kode unauthorized, forbidden
  lib/server/gateway/chat/                          chat-completions.ts (runChat bersama), stream-proxy.ts
                                                    (finishOnDisconnect), upstream-outcome.ts, upstream-usage.ts
                                                    (+ test), playground-chat.ts
  lib/server/gateway/request-billing.ts             keyId boleh null
```

Rencana awal (sebelum dibangun):

```
src/
  app/
    (dashboard)/playground/page.tsx                 + Suspense, sesi, katalog, base URL
    api/playground/chat/route.ts                    baru: POST
  components/dashboard/playground/
    use-playground.ts                               streaming sungguhan, abort, usage asli
    playground-view.tsx, chat-log.tsx,
    chat-composer.tsx, settings-panel.tsx           desain §7, data dari props
    playground-copy.ts                              hapus teks demo; teks error
    playground-cost.ts (+ test)                     pakai harga katalog asli
    playground-skeleton.tsx                         baru
  lib/
    playground-contract.ts (+ .test.ts)             baru: validasi body
    playground-client.ts                            baru: SSE
    server/gateway/chat-completions.ts              pisah langkah bersama
    server/gateway/playground-chat.ts               baru: pintu masuk sesi
    server/gateway/request-billing.ts               keyId boleh null
```

`components/dashboard/playground/` akan berisi 11 file (batas ~10): saat implementasi `playground-cost.ts` dan test-nya digabung ke kontrak atau dipindah, diputuskan saat itu. `src/lib/server/gateway/` akan berisi 12 file; usulan pengelompokan di §10 P7. Setelah struktur berubah: `npm run map`.

---

## 10. Keputusan owner

Diputuskan 2026-11-12: semua usulan di kolom kanan diterima ("Setuju semua").

| # | Pertanyaan | Keputusan |
|---|---|---|
| P1 | Playground memakai streaming? | Ya |
| P2 | Endpoint `POST /api/playground/chat` dengan bentuk §5.1? | Ya |
| P3 | **Uang:** Stop di tengah stream sekarang menagih seluruh tahanan bila usage belum datang. Untuk Playground: (a) tetap begitu, (b) tagih perkiraan token yang sudah diterima, atau (c) jangan putus ke Surplus, hanya berhenti menampilkan, lalu tagih usage asli? | (c): biaya selalu asli; konsekuensinya model tetap menjawab sampai selesai di belakang layar dan itu ikut ditagih |
| P4 | Batas body 256 KB? | Ya |
| P5 | Rate limit 20 request/menit per pengguna? | Ya |
| P6 | R1 Markdown (library baru), R2 perkiraan tahanan, R4 regenerate masuk v1? | R2 ya; R1 dan R4 fase berikutnya |
| P7 | Kelompokkan `lib/server/gateway/` (12 file) menjadi subfolder, mis. `chat/` untuk chat-completions, stream-proxy, upstream-*, playground-chat? | Ya, dalam perubahan yang sama |
| P8 | Penyetelan desain D1–D8? | Diterima semua |

---

## 11. Pengujian dan kriteria penerimaan

### 11.1 Unit
- Kontrak: body valid; role lain; `content` bukan string; 201 pesan; temperature 2,1; `max_tokens` 0; field `provider` ditolak.
- Pembaca SSE: potongan terpecah di tengah baris, `[DONE]`, event usage, event error.
- Biaya per giliran sama dengan `chargeMicros` server untuk token yang sama.

### 11.2 Integrasi (DB lokal, dev server, Surplus tiruan bila Surplus asli belum ada)
- Tanpa sesi → 401; Origin lain → 403; body > 256 KB → ditolak sebelum parsing.
- Model tidak aktif → 404; saldo 0 → 402.
- Satu giliran berhasil → satu baris `gateway_requests` dengan `api_key_id` null, `endpoint = "/playground/chat"`, saldo berkurang sebesar `charge_micros`.
- Stop → penagihan sesuai keputusan P3.
- Rate limit ke-21 dalam semenit → 429.
- Data uji dihapus setelahnya.

### 11.3 Kriteria penerimaan
- [ ] Tidak ada teks "Mode demo", `setTimeout` balasan, `mockModels`, `BASE_URL` contoh, atau `account` contoh di `components/dashboard/playground/`.
- [ ] `npx tsc --noEmit`, `npm run lint`, test lolos; `npm run map` dijalankan.
- [ ] Penjaga landing bersih; detector impeccable bersih pada file yang berubah.

---

## 12. Sumber dan bukti

| Sumber | Yang diambil | Status |
|---|---|---|
| `src/components/dashboard/playground/*` (10 file) | mockup, `setTimeout`, karakter ÷ 4, slider 64–4096, accent-soft, avatar contoh | Dibaca |
| `src/lib/server/gateway/chat-completions.ts`, `stream-proxy.ts`, `upstream-outcome.ts`, `request-billing.ts` | alur, tagihan saat putus, `keyId` wajib, `endpoint` | Dibaca |
| `src/lib/gateway/chat-contract.ts`, `price-math.ts` | validasi, `include_usage`, `chargeMicros`, `holdMicros`, `DEFAULT_OUTPUT_TOKENS` | Dibaca |
| `src/lib/server/gateway/public-api.ts`, `src/lib/server/auth/request-guard.ts` | rate limit per key, `readGuardedJson` 1 KB | Dibaca |
| `src/lib/display-name.ts` | `initialsOf` | Dicek |
| `PRD/gateway-api.md` §11, §15a, A1, A5, A6 | endpoint usulan, keputusan sesi + saldo, Surplus tiruan, hosting terbuka | Dibaca |
| `PRD/account-settings.md` S6 | inisial Playground masih contoh | Dibaca |
| Bentuk stream asli Surplus | — | **Belum dibuktikan** (gateway-api §15a) |
| Batas durasi request di hosting | — | **Tidak diketahui** (A6 terbuka) |
| Library Markdown (R1) | — | **Belum dicek** |
