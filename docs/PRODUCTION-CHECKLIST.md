# Production Readiness Checklist

Gunakan checklist ini pada pull request rilis dan simpan hasilnya pada catatan deployment.

## Repository & CI
- [ ] `pnpm-lock.yaml` dibuat dan di-commit.
- [ ] CI memakai `pnpm install --frozen-lockfile` dan seluruh job lulus.
- [ ] Tidak ada secret, dump database, atau file `.env` dalam repository.
- [ ] Dependensi ditinjau dan vulnerability penting ditangani.

## Environment & access
- [ ] Website dan dashboard memakai project/environment Vercel yang tepat.
- [ ] `DATABASE_URL` mengarah ke database yang benar.
- [ ] `CRON_SECRET`, session/auth secret, dan provider tokens kuat, unik, dan terpisah.
- [ ] Admin dibuat melalui bootstrap aman; tidak ada kredensial default.
- [ ] Domain HTTPS, redirect, dan cookie session diverifikasi.

## Database & recovery
- [ ] Backup sebelum migration dan bukti restore staging tersedia.
- [ ] Migration diuji pada salinan staging yang representatif.
- [ ] Rencana rollback aplikasi dan pemulihan data didokumentasikan.
- [ ] Kebijakan retensi backup dan akses database ditetapkan.

## Functional smoke tests
- [ ] Login/logout dan akses privat diuji.
- [ ] CRUD prospek, pelanggan, proyek/order, dan proposal diuji.
- [ ] Pemasukan, biaya, pembayaran, dan laporan diverifikasi silang.
- [ ] Retention, lifecycle, briefing, reminder, dan notifikasi diuji.
- [ ] Ekspor CSV aman dari formula injection.
- [ ] Cron ditolak tanpa secret valid dan berjalan saat secret valid.
- [ ] Health endpoints dan log error diperiksa setelah deploy.

## Release decision
- [ ] Semua quality gates lulus.
- [ ] Tidak ada blocker keamanan atau kehilangan data yang diketahui.
- [ ] Pemilik menyetujui rilis dan tahu prosedur rollback.

## Tambahan sebelum rilis v2.3

- [ ] Buat dan commit `pnpm-lock.yaml` menggunakan pnpm 12.14.0.
- [ ] Jalankan Prisma 7 `db:generate` dan `migrate deploy` terhadap staging; verifikasi seluruh indeks/foreign key migration baru.
- [ ] Jalankan unit test finance/KPI/attribution, semantic typecheck, lint, production build, dan Playwright tests.
- [ ] Uji pembayaran duplikat dengan idempotency key yang sama dan uji pembayaran melebihi sisa order.
- [ ] Uji klasifikasi transaksi: direct cost, operating expense, owner withdrawal, tax, loan principal, asset purchase, refund, dan unclassified.
- [ ] Uji lead dari website dengan dan tanpa UTM, consent, shared secret salah, body besar, serta rate limit.
- [ ] Uji publish/arsip layanan dan produk di GOS dan verifikasi katalog publik.
- [ ] Set `APP_TARGET=web` atau `APP_TARGET=gos` saat menjalankan preflight pada setiap deployment terpisah.
- [ ] Pastikan `GOS_LEAD_API_SECRET` dan `PUBLIC_LEAD_API_SECRET` sama di kedua aplikasi dan tidak muncul di client bundle.
- [ ] Uji cron cleanup dengan bearer token yang valid dan tidak valid.
- [ ] Verifikasi backup/restore PostgreSQL dan koneksi pool pada beban deployment.
