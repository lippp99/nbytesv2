# Audit halaman admin: Overview, Usage, Leaderboard, Request log, Upstream, Billing

Tanggal: 2026-11-13. Diminta owner: catat temuan langsung, hapus yang tumpang tindih, cek backend dan struktur.
Status tiap temuan: **dihapus** (sudah dikerjakan), **dicatat** (belum dikerjakan, perlu keputusan), **aman** (dicek, tidak ada masalah).

## Temuan

### T1. Billing "Lihat rincian" mengulang Usage dan 8 kartu Billing — dihapus
Baris pertama rincian (Pemakaian ditagih, Biaya Surplus, Margin kotor) sama persis dengan baris uang di Usage
(`usage-report.ts` dan `finance-report.ts` memakai rumus dan saringan periode yang sama). Baris 2–3 mengulang 8 kartu
Billing dengan nama lain (Biaya deposit, Biaya Sumopod, Biaya deposit bersih = Untung dari deposit, Margin gateway =
Untung dari API, Untung perkiraan = Untung bersih, Saldo USD masuk = Saldo pengguna bertambah).

### T2. Hitungan "request biayanya masih menunggu" ikut menghitung request gagal — diperbaiki
`settleRequest` (`src/lib/server/gateway/request-billing.ts`) memberi `cost_status = 'pending'` pada setiap request
yang biaya Surplus-nya kosong, termasuk request gagal yang tidak akan pernah punya biaya. Data lokal November: 156
"menunggu" = 55 berhasil (tagihan $2.19) + 101 gagal (tagihan $0). Terlihat di Overview, Usage, Upstream, Billing, dan
peringatan `costPendingOld` di Overview. Perbaikan menyentuh logika tagihan, jadi menunggu keputusan owner.

### T3. Overview "Angka bulan ini" mengulang Billing — dihapus
Pemakaian ditagih, Biaya Surplus, Margin kotor dan Deposit masuk bulan ini (`monthFigures` di
`src/lib/server/admin-overview/figures.ts`) adalah angka yang sama dengan Billing periode "bulan ini".

### T4. Overview "Kesehatan uang" mengulang Billing dan Upstream — dihapus
"Kurs berlaku" = kartu Kurs di Billing. "Saldo nbytes di Surplus" = kartu saldo di Upstream (keduanya membaca
`surplusBalance`). Total saldo pengguna, Cakupan, Akun saldo negatif dan Deposit terbuka hanya ada di Overview.

### T5. Overview "Model teratas" dan "Pengguna teratas" mengulang Usage dan Users — dihapus
Model teratas = tabel Per model di Usage (diurutkan Tagihan), 5 baris pertama dengan kolom yang sama. Pengguna
teratas = tabel Per pengguna di Usage (urut Tagihan); kolom "Saldo sekarang" juga ada di halaman Users.

### T6. Usage baris uang mengulang Billing — dihapus
Ditagih, Biaya Surplus, Margin kotor di Usage = Billing (rumus sama). Pengguna aktif dan jumlah model hanya ada di sini.

### T7. Leaderboard ringkasan mengulang Usage (dihapus); halamannya sendiri bagian dari Usage (dicatat)
Total token, Pengguna aktif, Model dipakai = ringkasan Usage. Tabel Leaderboard = 10 baris teratas tabel Usage yang
diurutkan Token, ditambah medali, porsi token dan model favorit. Menghapus halaman utuh butuh keputusan owner.

### T8. Aman (dicek, bukan duplikat)
- Request log: satu-satunya rincian per request.
- Upstream: saldo Surplus, kegagalan karena nbytes, kesehatan per model 24 jam (jendela berbeda dari Usage).
- Peringatan Overview: sinyal ringkas dari data halaman lain, memang tugasnya (PRD admin-overview §3.5).
- Grafik 30 hari Overview (tagihan vs biaya per hari): tidak ada di halaman lain (grafik Usage berisi token).

### T9. Ekspor yang hanya dipakai di filenya sendiri — dicatat
Pemindaian `export` di area admin, pembayaran dan `app-kit` menemukan tipe dan konstanta yang diekspor tapi tidak
diimpor file lain (mis. `USAGE_YEARS_MAX`, `RANGE_MAX_DAYS`, `MAX_IDR_PER_USD`, `USER_DEPOSITS_PAGE_SIZE`,
`WEBHOOK_EVENTS`, beberapa tipe `*Result`). Semuanya masih dipakai di file asalnya, jadi bukan kode mati; hanya kata
`export` yang tidak perlu. Tidak ada fungsi yang mati akibat penghapusan di audit ini (dicek ulang setelah semua hapus).

### T10. Halaman Leaderboard vs Usage — dicatat, butuh keputusan owner
Setelah ringkasannya dihapus, Leaderboard tinggal 10 baris teratas tabel Usage (urut Token) plus medali, porsi token
dan model favorit. Pilihan: biarkan (tampilan peringkat), atau hapus halaman dan tambahkan medali/porsi ke Usage.

## Yang dikerjakan

- T1: "Lihat rincian" dihapus dari Billing (`profit-summary.tsx`, teksnya di `billing-copy.ts`). Kurs rata-rata deposit
  pindah ke catatan kartu "Pengguna bayar pemakaian API" saat mode Rupiah. Field query yang tidak dipakai lagi
  (`chargeMicros`, `costPending`, `paidCount`, `netIdr`, `stuckCount`) dihapus dari `profitSummary` dan `ProfitSummary`.
  Deposit macet tetap terlihat lewat filter "Macet" di tabel deposit dan peringatan Overview.
- T6: baris uang Usage (Ditagih, Biaya Surplus, Margin kotor, Pengguna aktif) dihapus (`usage-summary.tsx`,
  `usage-copy.ts`). Jumlah pengguna dan model pindah ke catatan kartu Request. `UsageTotals` dan query `totals`
  tidak lagi mengambil angka uang. Kolom uang di tabel per model dan per pengguna tetap (rincian yang tidak ada di Billing).
- T3–T5: dari Overview dihapus baris "Angka bulan ini", "Saldo nbytes di Surplus", "Kurs berlaku", tabel "Model
  teratas" dan "Pengguna teratas". Ikut dihapus karena tidak dipakai lagi: `monthFigures`, `topModels`, `topUsers`,
  tipe `MonthFigures`/`TopModel`/`TopUser`, field `rateSetAt`, dan teksnya di `overview-copy.ts`. Saldo Surplus dan kurs
  tetap dibaca di server karena peringatan dan "Cakupan" memakainya. Kartu "Kesehatan uang" kini 4 kolom.
- T7: ringkasan Leaderboard (Total token, Pengguna aktif, Model dipakai, Porsi) dihapus; porsi 10 teratas pindah ke
  deskripsi kartu pengguna. `activeUsers` dan `usedModels` dihapus dari `Leaderboard` dan query `totals`.
- T2: aturan baru `costStatusOf` (`src/lib/gateway/price-math.ts`, dengan tes) dipakai `settleRequest`. Request gagal
  yang tidak pernah diberi id oleh Surplus kini `cost_status = null` (tidak ada biaya untuk dicek); yang gagal tapi
  punya id Surplus tetap `pending`, karena belum terbukti apakah Surplus menagihnya. Request log menampilkan "—" untuk
  baris tanpa biaya yang tidak menunggu. 101 baris mockup lokal diperbarui; November kini 55 "menunggu", bukan 156.
