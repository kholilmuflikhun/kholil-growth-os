# Phase 28 — Advanced Analytics & Data-Driven Recommendations

## Tujuan
Menyediakan tampilan analitik berbasis data tercatat untuk membantu pemilik usaha menilai tren pendapatan, biaya, kategori transaksi, nilai pelanggan, layanan berulang, pipeline, dan konversi prospek.

## Implementasi
- Halaman dashboard privat: `/analytics`.
- API privat: `GET /api/analytics` dengan autentikasi sesi.
- Tren pendapatan dan biaya enam bulan berdasarkan `FinancialTransaction.occurredAt`.
- Ringkasan target, persentase capaian, estimasi MRR dari care plan aktif, pipeline peluang terbuka, dan win rate prospek tertutup.
- Analisis kategori transaksi bulan berjalan.
- Daftar pelanggan berdasarkan pembayaran yang tercatat.
- Insight aturan sederhana yang transparan: target belum tercapai, perubahan pendapatan bulan ke bulan, dan konversi prospek.
- Navigasi dashboard telah memiliki tautan Business Intelligence ke `/analytics`.

## Definisi dan batasan
- Pendapatan dan biaya bersumber dari `FinancialTransaction`; transaksi yang belum dicatat tidak muncul.
- Angka net adalah pendapatan dikurangi biaya tercatat, bukan laporan laba rugi akuntansi penuh.
- Nilai pelanggan adalah total `Payment` yang terhubung ke pelanggan, bukan lifetime value yang memprediksi masa depan.
- MRR menormalisasi layanan bulanan, kuartalan, dan tahunan; paket one-time tidak dihitung.
- Pipeline tidak sama dengan pendapatan yang sudah diterima.
- Rekomendasi berbasis aturan, bukan model AI, dan tidak menjamin hasil bisnis.
- Tidak ada migration baru pada fase ini.

## Pengujian yang disarankan
1. Jalankan `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, dan `pnpm build`.
2. Uji `/analytics` dengan database kosong dan database berisi data.
3. Pastikan `/api/analytics` mengembalikan 401 ketika tidak login.
4. Cocokkan total pendapatan/biaya dengan Finance dan pembayaran pelanggan dengan Customer & Payments.
5. Uji bulan pergantian tahun dan transaksi tanpa kategori.
