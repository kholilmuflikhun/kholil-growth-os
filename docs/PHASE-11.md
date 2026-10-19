# Phase 11 — Revenue Growth Engine

## Tujuan
Membantu memodelkan target pendapatan dan kebutuhan aktivitas penjualan berdasarkan asumsi yang bisa diubah, lalu membandingkannya dengan data Growth OS.

## Fitur
- Halaman terlindungi `/revenue`.
- Menghitung kebutuhan pendapatan bulanan dari target dan asumsi yang dimasukkan pengguna.
- Memodelkan estimasi jumlah transaksi dan jumlah prospek yang diperlukan berdasarkan asumsi nilai transaksi dan konversi.
- Menampilkan perbandingan dengan transaksi keuangan, pendapatan yang diakui, pembayaran yang diterima, order, dan pipeline CRM yang tersedia.
- Mengambil metrik melalui agregasi database dan helper perhitungan keuangan bersama.

## Data dan konfigurasi
- Tidak memerlukan migrasi skema khusus Phase 11.
- Pastikan klasifikasi transaksi, status order, tanggal serah-terima, pembayaran, dan status prospek dicatat dengan benar.

## Batasan
- Hasil model adalah estimasi berbasis asumsi, bukan jaminan pencapaian target.
- Estimasi prospek dan transaksi sangat bergantung pada nilai rata-rata dan rasio konversi yang digunakan.
- Pendapatan yang diakui, kas masuk, dan nilai pipeline adalah metrik berbeda dan tidak boleh dijumlahkan seolah-olah sama.

## Kriteria penerimaan
- Perubahan asumsi memperbarui hasil kalkulasi dengan benar.
- Nilai kosong atau tidak valid ditangani tanpa menghasilkan angka menyesatkan.
- UI membedakan aktual dari estimasi dan menampilkan asumsi yang digunakan.
- Endpoint membutuhkan sesi yang valid dan tidak membocorkan data kepada pengguna anonim.
