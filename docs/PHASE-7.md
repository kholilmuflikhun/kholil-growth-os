# Phase 7 — Business Intelligence & Forecasting

## Tujuan
Menyajikan ringkasan kinerja bisnis dan proyeksi sederhana dari data yang telah tercatat agar pemilik dapat meninjau kondisi operasional dan menentukan tindak lanjut.

## Cakupan fitur
- Halaman terlindungi `/analytics` menampilkan tren pemasukan/pengeluaran tercatat selama enam bulan.
- Menampilkan arus kas bersih, estimasi pipeline CRM terbuka, aktivitas bulan berjalan, skor KPI, dan proyeksi pencapaian target.
- Rekomendasi berbasis aturan yang transparan menyoroti kebutuhan follow-up, pemeriksaan keuangan, dan pelaksanaan konten.
- Dashboard tidak memakai target pendapatan bulanan hard-coded ketika tidak ada goal aktif. Buat goal melalui `/goals` untuk mengaktifkan perhitungan progres target.
- Analitik membaca data PostgreSQL yang tersedia dan tidak memerlukan migrasi skema khusus untuk fase ini.

## Cara membaca proyeksi
Proyeksi menggunakan ekstrapolasi sederhana berdasarkan laju bulan berjalan. Angka tersebut merupakan estimasi, bukan jaminan hasil atau nasihat keuangan. Perubahan musiman, transaksi yang belum dicatat, dan data yang sedikit dapat membuat hasil kurang representatif.

Pipeline CRM adalah estimasi peluang, bukan uang yang telah diterima. Pemasukan dan pengeluaran tercatat juga tidak otomatis sama dengan laba akuntansi.

## Kriteria penerimaan
- Halaman hanya dapat diakses sesuai autentikasi/otorisasi yang berlaku.
- Grafik dan ringkasan memakai rentang waktu yang konsisten dengan labelnya.
- Tidak ada target buatan yang ditampilkan seolah-olah berasal dari goal pengguna.
- Rekomendasi dapat ditelusuri ke aturan/data yang digunakan.
- Kondisi data kosong, nilai nol, dan periode yang belum lengkap ditampilkan secara wajar.
- Pengujian agregasi, akses, dan tampilan dijalankan sebelum rilis.
