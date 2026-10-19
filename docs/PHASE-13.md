# Phase 13 — Customer & Order Fulfillment

## Alur kerja
1. Buat proposal dari modul Sales Pipeline & Proposals.
2. Perbarui status proposal menjadi **Disetujui**.
3. Buka **Customer & Orders** lalu konversi proposal menjadi order.
4. Atur status, tanggal mulai, tenggat, dan proyek terkait.
5. Catat uang muka/pelunasan sebagai transaksi aktual pada modul Finance. Jangan menganggap nilai order sebagai uang masuk sebelum pembayaran diterima.

## Status order
- `CONFIRMED`: pesanan disepakati dan menunggu pelaksanaan.
- `IN_PROGRESS`: pekerjaan sedang dikerjakan.
- `DELIVERED`: pekerjaan telah diserahkan/diselesaikan.
- `CANCELLED`: pesanan dibatalkan.

## Perlindungan data
- Endpoint API mensyaratkan sesi dan role `OWNER`, `ADMIN`, atau `MANAGER`.
- Konversi hanya menerima proposal `ACCEPTED`.
- `proposalId` unik mencegah pembuatan order ganda dari proposal yang sama.
- Validasi status dan tanggal dilakukan pada server.

## Aktivasi
Jalankan migration dengan mekanisme Prisma yang digunakan pada lingkungan deployment, lalu generate Prisma Client dan jalankan typecheck/build. Pastikan `DATABASE_URL` mengarah ke database yang benar sebelum migrasi.
