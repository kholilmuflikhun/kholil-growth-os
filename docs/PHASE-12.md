# Phase 12 — Sales Pipeline & Proposal Management

## Tujuan
Membuat proses penawaran lebih terstruktur dengan menghubungkan proposal ke lead CRM dan mencatat status penawaran.

## Fitur
- Halaman `/proposals` untuk membuat, melihat, memperbarui, dan menghapus proposal.
- Setiap proposal terhubung ke lead yang sudah ada.
- Field utama meliputi judul, nilai penawaran, status, tanggal dikirim, tanggal berlaku, dan catatan.
- Status proposal: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, dan `EXPIRED`.
- Pembuatan proposal dapat memperbarui status lead menjadi `PROPOSAL`; perubahan status proposal dapat memperbarui tahap lead.
- API `/api/proposals` memerlukan role `OWNER`, `ADMIN`, atau `MANAGER`.

## Database
- Model Prisma: `Proposal` dan relasi ke `Lead`.
- Migrasi: `prisma/migrations/202610160003_proposals/migration.sql`.
- Jalankan `pnpm db:generate` dan `pnpm db:migrate` setelah memperbarui source.

## Batasan
- Proposal yang diterima tidak otomatis dicatat sebagai pemasukan ke Finance.
- Proposal yang diterima tidak dengan sendirinya berarti pembayaran sudah diterima atau pekerjaan sudah diserahterimakan.
- Proses konversi ke order dan pencatatan pembayaran berada di modul lanjutan terkait.

## Kriteria penerimaan
- Proposal harus merujuk ke lead yang valid.
- Nilai penawaran harus berupa angka positif dan dalam batas validasi.
- Status dan tanggal yang tidak valid ditolak.
- Perubahan proposal dan status lead yang terkait dapat diverifikasi melalui UI/API.
- Pengguna tanpa role yang sesuai tidak dapat mengelola proposal.
