# Phase 6 — Project-to-Finance Integration

## Tujuan
Menghubungkan transaksi keuangan dengan proyek terkait agar pemilik bisnis dapat meninjau pemasukan dan pengeluaran yang secara eksplisit dicatat untuk setiap proyek.

## Cakupan fitur
- Transaksi keuangan dapat ditautkan secara opsional ke proyek melalui `projectId`.
- Form Finance menyediakan pemilih proyek.
- Riwayat transaksi menampilkan proyek yang terkait.
- Daftar proyek merangkum pemasukan dan pengeluaran tercatat yang ditautkan ke proyek.
- Ekspor CSV Finance menyertakan nama proyek.
- Migrasi `202610150002_project_finance_link` menambahkan relasi opsional dan indeks.

## Definisi perhitungan
Ringkasan proyek hanya menghitung transaksi yang secara eksplisit ditautkan ke proyek tersebut. Transaksi tanpa `projectId` tetap menjadi transaksi keuangan umum dan tidak boleh otomatis dialokasikan ke proyek.

Nilai pemasukan/pengeluaran yang tercatat bukan otomatis laba akuntansi final. Perhitungan dapat belum mencakup akrual, pajak, persediaan, biaya yang belum dicatat, atau kewajiban lainnya.

## Aktivasi
Jalankan migrasi dan generate Prisma Client sesuai prosedur repository:

```bash
pnpm db:generate
pnpm db:migrate
```

Lakukan backup atau gunakan database development/staging saat memvalidasi migrasi.

## Kriteria penerimaan
- `projectId` bersifat opsional dan relasi tervalidasi.
- Form transaksi dapat memilih proyek yang sah.
- Riwayat dan ekspor menampilkan hubungan proyek secara konsisten.
- Agregat per proyek hanya menghitung transaksi yang benar-benar ditautkan.
- Akses lintas proyek dan penanganan proyek yang dihapus diuji.
