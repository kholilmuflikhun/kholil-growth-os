# Phase 8 — Reminders & Action Center

## Tujuan
Menyediakan pengingat operasional yang dapat dikelola dari Growth OS agar tenggat dan tindakan penting tidak mudah terlewat.

## Fitur
- Halaman terlindungi `/reminders` untuk melihat dan membuat pengingat.
- Pengguna dengan role `OWNER`, `ADMIN`, atau `MANAGER` dapat mengubah judul, deskripsi, tanggal/waktu jatuh tempo, prioritas, dan status.
- Prioritas yang didukung: `LOW`, `MEDIUM`, dan `HIGH`.
- Status yang didukung: `OPEN` dan `DONE`; pengingat dapat dibuka kembali dengan mengubah status ke `OPEN`.
- Pengingat yang lewat tenggat dapat ditandai di UI.
- API `/api/reminders` menyediakan operasi baca, buat, ubah, dan hapus dengan pemeriksaan sesi/role dan validasi input.

## Database
- Model Prisma: `Reminder`.
- Migrasi: `prisma/migrations/202610160001_reminders/migration.sql`.
- Setelah memperbarui source, jalankan `pnpm db:generate` dan `pnpm db:migrate` pada lingkungan development/staging sebelum menggunakan fitur.

## Batasan
- Pengingat adalah catatan operasional, bukan kalender tersinkronisasi.
- Pengingat tidak dengan sendirinya menjamin notifikasi eksternal terkirim.
- Zona waktu dan tampilan tanggal perlu diperiksa pada lingkungan target.

## Kriteria penerimaan
- Pengguna tanpa sesi atau role yang sesuai tidak dapat mengelola pengingat.
- Judul, prioritas, dan tanggal yang tidak valid ditolak.
- Perubahan status dan tenggat tersimpan serta terlihat setelah halaman dimuat ulang.
- Penghapusan hanya berhasil untuk pengingat yang ada.
