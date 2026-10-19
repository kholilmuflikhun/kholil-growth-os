# Phase 4 — Goals & Strategy, CSV Export

## Tujuan
Membantu pemilik bisnis mencatat sasaran strategis dan mengekspor data CRM serta transaksi keuangan untuk analisis dan pelaporan.

## Cakupan fitur
- Goals & Strategy mendukung pembuatan goal berbasis database dan perubahan status melalui `/api/goals`.
- Ekspor CRM tersedia melalui `/api/leads/export` dan memerlukan sesi terautentikasi.
- Ekspor transaksi keuangan bulanan tersedia melalui `/api/finance/export?month=YYYY-MM` dan memerlukan sesi terautentikasi.
- Ekspor CSV meng-escape tanda kutip dan menetralkan nilai yang dapat memicu formula spreadsheet.

## Alur penggunaan
1. Masuk ke dashboard Growth OS.
2. Buka modul Goals & Strategy untuk membuat atau memperbarui sasaran.
3. Buka CRM atau Finance untuk meninjau data yang ingin diekspor.
4. Gunakan endpoint ekspor yang sesuai dan pilih periode keuangan dalam format `YYYY-MM`.
5. Periksa isi CSV sebelum dibagikan atau digunakan untuk pelaporan eksternal.

## Keamanan dan batasan
- Endpoint ekspor dilindungi sesi; jangan menghapus pemeriksaan otorisasi ketika melakukan perubahan.
- Perlindungan formula CSV mengurangi risiko formula injection, tetapi file tetap harus diperlakukan sebagai data bisnis yang mungkin sensitif.
- Ekspor hanya merepresentasikan data yang tercatat dan tersedia pada database; bukan pengganti rekonsiliasi akuntansi.

## Kriteria penerimaan
- Goal tersimpan dan status dapat diperbarui sesuai otorisasi.
- Pengguna tanpa sesi tidak dapat mengakses ekspor yang dilindungi.
- Parameter bulan divalidasi dan ekspor berisi periode yang diminta.
- Nilai CSV yang berisi tanda kutip atau awalan formula ditangani dengan aman.
- Pengujian endpoint dan alur UI dijalankan pada lingkungan yang dikonfigurasi.
