# Phase 22 — Revenue Forecast & Target Pacing

## Tujuan
Membantu pemilik memantau pencapaian target bulanan, proyeksi sederhana berdasarkan laju pendapatan yang tercatat, sisa target, kebutuhan pendapatan rata-rata per hari kalender tersisa, pipeline peluang terbuka, pipeline tertimbang, dan estimasi MRR dari layanan aktif.

## Akses
Buka `/forecast` dari dashboard GOS. Tidak ada perubahan skema database pada fase ini.

## Perhitungan
- Target: Goal aktif yang mencakup tanggal hari ini; jika tidak ada, memakai fallback Rp5.200.000/bulan (Rp200.000 x 26 hari aktif).
- Pendapatan dan pengeluaran: transaksi keuangan bertanggal pada bulan berjalan.
- Proyeksi akhir bulan: rata-rata pendapatan per hari kalender yang telah berlalu dikali jumlah hari kalender dalam bulan.
- Pipeline tertimbang: ide 15%, dihubungi 30%, proposal 60%. Bobot ini asumsi awal dan bukan probabilitas terkalibrasi.
- MRR: layanan aktif dinormalisasi ke estimasi bulanan; layanan sekali bayar tidak dihitung.

## Batasan
Proyeksi bukan jaminan. Halaman belum memperhitungkan hari libur, kapasitas kerja, biaya yang belum dicatat, pajak, piutang yang belum dibayar, dan probabilitas historis konversi. Pipeline bukan pendapatan kas. Gunakan data transaksi yang rutin diperbarui.
