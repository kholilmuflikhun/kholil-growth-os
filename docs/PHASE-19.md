# Phase 19 — Monthly Business Review & Strategic Planning

## Tujuan
Menggabungkan hasil bulanan dengan perencanaan strategis yang tersimpan, sehingga review bukan hanya laporan tetapi juga keputusan target dan fokus kerja untuk periode berikutnya.

## Fitur
- Pemilih bulan untuk membaca performa pada periode tertentu.
- KPI bulanan: pemasukan/biaya dari Finance, perbandingan dengan bulan sebelumnya, progres target, CRM, pipeline, konten, eksekusi, KPI, proyek terlambat, follow-up, dan piutang.
- Grafik pemasukan harian dan kategori pemasukan teratas.
- Rekomendasi prioritas berdasarkan data yang tersedia, termasuk pace pendapatan, follow-up CRM, penagihan, proyek terlambat, dan konsistensi konten.
- Form strategic plan per bulan: ringkasan, pencapaian, tantangan, tiga fokus, target pendapatan, target prospek, dan target konten.
- Data plan disimpan pada model `MonthlyPlan`, dengan `monthKey` unik agar satu periode memiliki satu rencana.
- API `GET /api/monthly-review?month=YYYY-MM` untuk review dan `PUT /api/monthly-review` untuk menyimpan rencana.

## Definisi metrik
- Pemasukan dan biaya berasal dari `FinancialTransaction` menurut `occurredAt`.
- Nominal pada `DailyExecution` hanya untuk atribusi aktivitas dan tidak dijumlahkan ke Finance.
- Nilai pipeline berasal dari estimasi nilai prospek aktif; bukan pemasukan terkonfirmasi.
- Piutang dihitung dari nominal order dikurangi total payment tercatat.
- Lead WON dihitung berdasarkan `updatedAt` dalam periode; bukan histori perubahan status.
- Skor KPI berbobot menghitung attainment per KPI, dibatasi maksimum 150% per item, lalu dikalikan bobot tersimpan. Data KPI yang tumpang tindih dengan bulan dapat mencakup rentang periode yang lebih panjang.

## Migration dan menjalankan
Migration baru: `202610160008_monthly_strategy_plan`.

Dari root monorepo:
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:migrate`
4. `pnpm --filter @kholil/gos dev`
5. Login lalu buka `/monthly-review`.

## Verifikasi
ZIP telah diperiksa integritasnya. Build/typecheck dan migrasi ke database PostgreSQL nyata perlu dilakukan pada lingkungan pengembangan.
