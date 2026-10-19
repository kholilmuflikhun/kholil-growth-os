# Phase 15 — Profitability & Business Intelligence

## Penambahan
- Ringkasan pemasukan, biaya, dan net untuk tiap proyek berdasarkan transaksi Finance yang benar-benar ditautkan ke proyek.
- Piutang order dihitung dari nilai order dikurangi total pembayaran aktual yang tercatat.
- Daftar prioritas penagihan diurutkan berdasarkan sisa tagihan terbesar.
- Ranking kategori pemasukan bulan berjalan.
- Rekomendasi tindakan menambahkan perhatian untuk piutang terbuka dan proyek yang memiliki biaya lebih besar daripada pemasukan tercatat.

## Definisi dan batasan
- `Net proyek = pemasukan transaksi tertaut - pengeluaran transaksi tertaut`; ini bukan laba bersih akuntansi dan tidak mencakup biaya yang belum dicatat atau belum ditautkan.
- Nilai order bukan pemasukan aktual. Pemasukan tercatat melalui pembayaran pada modul Customers & Payments atau transaksi Finance.
- Kategori pemasukan adalah label transaksi, bukan otomatis klasifikasi layanan.
- Target vs realisasi dan proyeksi sederhana tetap tersedia pada Business Intelligence.

## Cara meningkatkan kualitas laporan
1. Selalu pilih proyek saat mencatat transaksi terkait proyek.
2. Catat setiap uang masuk melalui modul pembayaran order atau Finance, jangan menggandakan transaksi.
3. Gunakan kategori Finance yang konsisten.
4. Periksa piutang dan proyek dengan net negatif secara berkala.
