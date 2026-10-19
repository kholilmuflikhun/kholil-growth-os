# Phase 21 — Client Lifecycle & Upsell Engine

## Tujuan
Mengubah riwayat pelanggan menjadi daftar peluang tindak lanjut dan penjualan tambahan yang bisa dikelola.

## Fitur
- Segmentasi berbasis data pelanggan: pernah memesan, belum memiliki layanan berulang, tidak ada pesanan selama lebih dari 90 hari, renewal dalam 30 hari, follow-up layanan jatuh tempo, dan pelanggan dengan pembayaran kumulatif minimal Rp5.000.000.
- Rekomendasi layanan yang relevan untuk setiap sinyal; rekomendasi merupakan heuristik dan perlu diverifikasi manual.
- Pipeline peluang: Ide, Dihubungi, Proposal, Berhasil, Tidak berhasil.
- Nilai pipeline terbuka, total nilai peluang berhasil, dan jumlah follow-up yang terlambat.
- Prioritas dan tanggal tindak lanjut.
- API terproteksi sesi dan model `ClientOpportunity` yang terkait dengan pelanggan.

## Database
Migration baru: `202610160010_client_lifecycle_upsell`. Jalankan `pnpm db:generate` dan `pnpm db:migrate`. Jangan menghapus atau mengubah migration sebelumnya.

## Catatan operasional
- Nilai peluang adalah estimasi manual, bukan pendapatan yang sudah diterima.
- Sinyal pelanggan hanya memakai data yang tersedia di Growth OS; riwayat yang belum dicatat tidak dapat dianalisis.
- Penghapusan peluang tidak menghapus pelanggan, pesanan, atau transaksi. Penghapusan pelanggan mengikuti relasi cascade yang sudah ditentukan pada skema.
- Belum ada pengiriman WhatsApp/email otomatis; tindak lanjut tetap dilakukan manual.
