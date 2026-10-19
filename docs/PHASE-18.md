# Phase 18 — Weekly Business Review & Performance Coach

## Tujuan
Membuat evaluasi mingguan berbasis data agar pengguna bisa memahami perubahan performa dan memilih prioritas minggu berikutnya.

## Fitur
- Pemilih minggu dan perbandingan dengan 7 hari sebelumnya.
- KPI mingguan: pemasukan, biaya, selisih, perubahan pemasukan/biaya, prospek baru, prospek menang yang diperbarui pada periode, aktivitas dan waktu eksekusi.
- Progress terhadap pace target mingguan. Jika ada Goal aktif yang rentang tanggalnya tumpang tindih dengan periode, target tersebut digunakan; jika tidak, fallback target Rp5.200.000 per bulan.
- Visualisasi pemasukan harian Finance, konten terjadwal/terpublikasi, prospek baru, nilai pipeline aktif, tindakan terlambat, dan proyek lewat tenggat.
- Performance Coach menghasilkan rekomendasi berprioritas berdasarkan data yang tersedia dan tautan ke modul terkait.
- API read-only berautentikasi `GET /api/weekly-review?week=YYYY-MM-DD`.

## Definisi dan keterbatasan metrik
- Pemasukan dan biaya diambil dari `FinancialTransaction` berdasarkan `occurredAt`.
- Prospek baru berdasarkan `createdAt`; jumlah "menang" dihitung dari lead berstatus WON yang `updatedAt`-nya berada pada minggu tersebut (bukan histori perubahan status yang terpisah).
- Aktivitas dan waktu berdasarkan `DailyExecution`; nominal teratribusi pada tracker tidak ditambahkan ke Finance untuk mencegah penghitungan ganda.
- Nilai pipeline adalah penjumlahan estimasi nilai prospek aktif, bukan kas atau penjualan terkonfirmasi.
- Target pace mingguan adalah target bulanan dibagi rata-rata minggu kalender (30,4375/7), sehingga merupakan indikator pace, bukan target kontraktual yang diatur per minggu.

## Menjalankan
Dari root monorepo:
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:migrate`
4. `pnpm --filter @kholil/gos dev`
5. Login lalu buka `/weekly-review`.

## Verifikasi
Tidak ada perubahan schema/migration pada fase ini. Source ZIP diperiksa integritasnya; build/typecheck dan pengujian terhadap database aktif perlu dilakukan di lingkungan pengembangan.
