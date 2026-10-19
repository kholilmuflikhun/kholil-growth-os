# Phase 29 — Sales Conversion & Profitability Optimization

## Tujuan
Menghubungkan data CRM, proposal, order, transaksi keuangan, proyek, dan peluang upsell agar pemilik bisnis dapat menentukan tindakan penjualan berdasarkan catatan aktual.

## Fitur
- Win rate prospek dari status WON dibanding prospek tertutup WON + LOST.
- Konversi proposal berdasarkan proposal yang tidak berstatus DRAFT/CANCELLED dan proposal yang terhubung ke order atau status menang.
- Ringkasan pemasukan, biaya, dan selisih bulan berjalan.
- Ringkasan kategori transaksi dengan net dan margin indikatif.
- Ringkasan proyek dengan transaksi terkait; nilai order menjadi proksi pendapatan jika tidak ada transaksi pemasukan yang terhubung.
- Daftar layanan dengan sinyal permintaan dari prospek dan estimasi nilai prospek yang menang.
- Insight berbasis aturan dengan penjelasan keterbatasan data.
- Endpoint terautentikasi `GET /api/sales-optimization`.

## Cara menjalankan
Tidak ada migration database baru.

```bash
pnpm install
pnpm db:generate
pnpm --filter @kholil/gos dev
```

Buka `/sales-optimization` setelah login. Endpoint JSON tersedia di `/api/sales-optimization` dan memerlukan sesi login.

## Definisi dan batasan
- Semua angka dihitung dari data yang dicatat; data kosong tidak dianggap sebagai hasil nol yang pasti secara bisnis.
- Net kategori adalah pemasukan dikurangi biaya pada kategori transaksi yang sama, bukan alokasi biaya penuh per layanan.
- Profit proyek memakai transaksi yang terhubung ke proyek. Nilai order hanya proksi bila tidak ada transaksi pemasukan yang ditautkan; angka ini bukan laba akuntansi final.
- Konversi proposal bisa berbeda dari win rate lead karena alur status proposal pada data lama mungkin tidak seragam.
- Rekomendasi berbasis aturan deterministik, bukan prediksi AI.
