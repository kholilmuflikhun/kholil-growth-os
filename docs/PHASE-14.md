# Phase 14 — Customer Database & Payment Tracking

## Fitur
- Database pelanggan dengan nama, nama usaha, telepon, email, dan pencarian.
- Order bisa terhubung ke record pelanggan.
- Pencatatan uang muka, cicilan, atau pelunasan pada order.
- Metode pembayaran: tunai, transfer bank, QRIS, atau lainnya.
- Setiap pembayaran tersimpan sebagai `Payment` dan membuat satu `FinancialTransaction` tipe `INCOME` dalam transaksi database yang sama.
- Ringkasan pembayaran dan sisa piutang dari nilai order dikurangi pembayaran aktual.
- Riwayat pembayaran dapat ditelusuri ke Finance melalui `transactionId`.

## Cara pakai
1. Pastikan proposal sudah disetujui dan dikonversi menjadi order di `/orders`.
2. Buka `/customers` untuk meninjau pelanggan dan order.
3. Pada form pembayaran, pilih order dengan sisa tagihan.
4. Masukkan nominal yang benar-benar diterima, tanggal, metode, dan referensi bukti.
5. Sistem memvalidasi nominal agar tidak melebihi sisa tagihan dan mencatat transaksi pemasukan Finance secara otomatis.

## Integritas data
- Endpoint pelanggan dan pembayaran memerlukan sesi dan role `OWNER`, `ADMIN`, atau `MANAGER`.
- Pembayaran untuk order yang dibatalkan ditolak.
- Total pembayaran tidak boleh melampaui nilai order.
- Pencatatan pembayaran dan transaksi Finance dilakukan dalam satu transaksi database agar keduanya konsisten.
- Jangan mencatat ulang pembayaran yang sama secara manual pada modul Finance.

## Aktivasi
Jalankan migration `prisma/migrations/202610160005_customer_payments/migration.sql`, generate Prisma Client, lalu jalankan typecheck/build sebelum deploy. Backup database sebelum migrasi produksi.
