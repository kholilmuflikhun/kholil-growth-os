# Phase 9 — Integrations & Notification Automation

## Tujuan
Membuat notifikasi dalam aplikasi dari pengingat yang mendekati tenggat atau sudah terlambat, dengan endpoint dispatch yang dapat dipanggil oleh scheduler terautentikasi.

## Fitur
- Halaman `/notifications` menampilkan notifikasi milik pengguna yang sedang masuk, hingga 100 item terbaru.
- Pengguna dapat menandai satu notifikasi atau seluruh notifikasi sebagai sudah dibaca.
- Endpoint `/api/automation/dispatch` memeriksa bearer token terhadap `CRON_SECRET`.
- Pengingat terbuka yang jatuh tempo dalam 24 jam dapat menghasilkan notifikasi `UPCOMING`; pengingat yang terlambat menghasilkan notifikasi `OVERDUE`.
- `dedupeKey` unik mencegah notifikasi duplikat ketika dispatch diulang atau berjalan bersamaan.
- Pengiriman email melalui Resend dan WhatsApp melalui WhatsApp Cloud API bersifat opsional dan memerlukan konfigurasi provider server-side.

## Konfigurasi
- Tetapkan `CRON_SECRET` dengan nilai acak yang kuat dan berbeda dari secret lain.
- Email opsional: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, dan `NOTIFICATION_EMAIL_TO`.
- WhatsApp opsional: `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, dan `WHATSAPP_TO`.
- Jangan menaruh token provider di variabel `NEXT_PUBLIC_*` atau meng-commit secret ke repository.
- Pastikan scheduler deployment memanggil `/api/automation/dispatch` menggunakan header `Authorization: Bearer <CRON_SECRET>`.

## Database
- Model Prisma: `Notification`, relasi opsional ke `Reminder`, dan `dedupeKey` unik.
- Migrasi: `prisma/migrations/202610160002_notifications_automation/migration.sql`.
- Jalankan `pnpm db:generate` dan `pnpm db:migrate` setelah memperbarui source.

## Batasan
- Endpoint dispatch perlu dijadwalkan secara eksplisit di lingkungan deployment. Jangan menganggap konfigurasi cron lain otomatis menjalankan endpoint ini.
- Jika provider email/WhatsApp belum lengkap, notifikasi dalam aplikasi tetap menjadi sumber utama.
- Keberhasilan request provider tidak menjamin penerima telah membaca pesan.

## Kriteria penerimaan
- Request dispatch tanpa bearer secret yang benar ditolak.
- Pengguna hanya dapat membaca dan memperbarui notifikasinya sendiri.
- Pengulangan dispatch tidak menghasilkan notifikasi ganda untuk reminder dan jenis yang sama.
- Kegagalan provider eksternal tidak membatalkan notifikasi dalam aplikasi.
