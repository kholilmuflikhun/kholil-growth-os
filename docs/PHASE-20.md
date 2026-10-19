# Phase 20 — Client Retention & Recurring Revenue Engine

## Tujuan
Membantu mempertahankan pelanggan dan mengelola paket layanan berkala yang berpotensi menghasilkan pendapatan lebih terprediksi.

## Fitur
- Paket layanan pelanggan yang terhubung ke Customer.
- Periode layanan: bulanan, per 3 bulan, tahunan, satu kali.
- Status paket: ACTIVE, PAUSED, CANCELLED, COMPLETED.
- Tanggal mulai, renewal berikutnya, follow-up berikutnya, kontak terakhir, dan catatan ruang lingkup.
- Metrik MRR dan ARR estimasi, jumlah paket aktif, follow-up jatuh tempo, dan renewal 30 hari ke depan.
- Tindakan cepat untuk mencatat kontak, menjeda/mengaktifkan paket, dan menggeser renewal.
- API berautentikasi `GET/POST/PATCH/DELETE /api/retention`.
- Migration `202610160009_customer_care_retention`.

## Definisi MRR/ARR
- Bulanan = nilai per bulan.
- Per 3 bulan = nilai kontrak dibagi 3.
- Tahunan = nilai kontrak dibagi 12.
- Satu kali tidak dihitung ke MRR/ARR.
- Metrik adalah estimasi nilai kontrak aktif, bukan pembayaran aktual atau jaminan perpanjangan.

## Batasan integrasi
Paket layanan tidak otomatis membuat invoice, order, payment, atau transaksi Finance. Catat order dan pembayaran aktual di modul terkait agar pembukuan tetap akurat. Modul ini mengelola retensi dan jadwal hubungan pelanggan.

## Menjalankan
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:migrate`
4. `pnpm --filter @kholil/gos dev`
5. Login lalu buka `/retention`.

## Verifikasi
ZIP integrity diperiksa. Build/typecheck dan migration pada database PostgreSQL nyata perlu dilakukan di lingkungan pengembangan.
