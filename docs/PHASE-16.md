# Phase 16 — Business Decision & Action Center

## Tujuan
Mengubah data operasional Growth OS menjadi daftar tindakan yang dapat diprioritaskan, ditugaskan secara manual, dan ditutup setelah selesai.

## Fitur
- Halaman `/actions` untuk membuat dan mengelola action items.
- Status tindakan: `OPEN`, `IN_PROGRESS`, `DONE`, `IGNORED`.
- Prioritas: `LOW`, `MEDIUM`, `HIGH`, `URGENT`; kategori penjualan, penagihan, proyek, target pemasukan, operasional, dan umum.
- Tenggat opsional, indikator keterlambatan, filter status, serta tautan ke modul sumber.
- Tombol **Buat rekomendasi** membaca data CRM, order/pembayaran, proyek, pengingat, dan target pemasukan.
- Rekomendasi menggunakan `sourceKey` unik dan `createMany(skipDuplicates)` agar pengulangan generator tidak membuat duplikat untuk sumber yang sama.
- API `/api/actions` dilindungi sesi dan role `OWNER`, `ADMIN`, atau `MANAGER`.

## Catatan perilaku
- Generator hanya membuat rekomendasi; tidak mengirim pesan ke prospek/pelanggan, tidak mengubah order, dan tidak membuat transaksi keuangan.
- Piutang yang belum jatuh tempo tidak diprioritaskan; piutang tanpa tanggal jatuh tempo dapat masuk sebagai tindakan penagihan.
- Item yang selesai tetap tersimpan dan tidak digandakan pada proses generator berikutnya. Jika item rekomendasi dihapus, sumber yang masih memenuhi kondisi dapat menghasilkan rekomendasi baru pada proses berikutnya.
- Perhitungan target menggunakan pemasukan Finance yang tercatat pada bulan berjalan.

## Database
Migration baru: `prisma/migrations/202610160006_action_center/migration.sql`.

Jalankan setelah mengambil source terbaru:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm --filter @kholil/gos typecheck
pnpm --filter @kholil/gos build
```
