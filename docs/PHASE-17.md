# Phase 17 — Daily Execution & Revenue Tracker

## Tujuan
Menghubungkan target pertumbuhan dengan eksekusi yang benar-benar dilakukan setiap hari. Fokus default: Rp200.000 per hari aktif, Rp5.200.000 per bulan, dan 26 hari aktif. Target memakai Goal aktif jika tersedia; fallback tracker adalah Rp5.200.000 dan 26 hari aktif.

## Fitur
- Catatan eksekusi per tanggal: aktivitas, kategori, hasil, durasi, pemasukan teratribusi, biaya teratribusi.
- Opsional mengaitkan catatan dengan Action Center.
- Ringkasan periode: pemasukan, biaya, selisih teratribusi, waktu eksekusi, jumlah hari aktif yang tercatat.
- Progress target bulanan dan gap target harian.
- Filter bulan, daftar riwayat, dan hapus catatan salah input.
- API berautentikasi `GET/POST/PATCH/DELETE /api/execution`.
- Migration `202610160007_daily_execution_tracker`.

## Catatan integritas keuangan
Nominal pada tracker adalah atribusi aktivitas dan tidak otomatis membuat `FinancialTransaction`. Catat pemasukan/pengeluaran resmi di Finance untuk menghindari duplikasi dalam laporan keuangan. Tracker menunjukkan atribusi, bukan laba akuntansi.

## Menjalankan
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:migrate`
4. `pnpm --filter @kholil/gos dev`
5. Login dan buka `/execution`.

## Verifikasi
Source dan migration ditambahkan. Build/typecheck serta migration pada database nyata perlu dijalankan pada lingkungan yang memiliki dependencies dan PostgreSQL terkonfigurasi.
