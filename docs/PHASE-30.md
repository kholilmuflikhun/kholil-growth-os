# Phase 30 — Final Integration, QA & Production Readiness

## Tujuan
Menetapkan quality gates yang dapat diulang untuk source code Growth Operating System sebelum dipakai di produksi. Phase ini menambahkan workflow CI dan smoke test health endpoint; ini bukan bukti bahwa semua test/build sudah lolos.

## Yang ditambahkan
- GitHub Actions workflow `.github/workflows/quality-gates.yml`: install dependency, generate Prisma client, test, typecheck, lint, dan build.
- `pnpm qa`: menjalankan quality gates yang sama secara lokal.
- `pnpm smoke`: memeriksa health endpoint website dan GOS.
- `docs/PRODUCTION-CHECKLIST.md`: checklist staging, database, secret, backup/rollback, dan smoke test.

## Jalankan quality gates
```bash
pnpm install
pnpm db:generate
pnpm qa
```

Workflow CI menggunakan `--no-frozen-lockfile` karena repository awal belum menyertakan `pnpm-lock.yaml`. Setelah menjalankan install, commit `pnpm-lock.yaml`, lalu ubah workflow menjadi `pnpm install --frozen-lockfile` untuk reproducibility sebelum produksi.

## Smoke test
Jalankan kedua aplikasi di terminal terpisah, lalu:
```bash
pnpm smoke
```
Default URL:
- Website: `http://localhost:3000/api/health`
- Dashboard GOS: `http://localhost:3001/api/health`

Untuk staging/production, set `WEB_HEALTH_URL` dan `GOS_HEALTH_URL` ke endpoint health yang tepat. Smoke test hanya memeriksa health endpoints, bukan seluruh alur bisnis atau autentikasi.

## Gate sebelum produksi
1. Semua test, typecheck, lint, dan build lulus di CI.
2. Uji seluruh migration pada staging dengan versi PostgreSQL yang sesuai.
3. Backup database dan dokumentasikan langkah restore/rollback sebelum migrasi produksi.
4. Set secret unik di Vercel; jangan commit `.env` atau kredensial.
5. Bootstrap admin menggunakan environment secret yang kuat; jangan memakai akun demo.
6. Uji login/logout, akses endpoint privat, CRM, transaksi, pembayaran, retention, briefing, notifikasi, dan ekspor CSV.
7. Verifikasi cron berjalan dan endpoint tidak dapat dipanggil tanpa `CRON_SECRET` yang valid.
8. Jalankan `pnpm smoke` terhadap deployment dan pantau log/error setelah rilis.
9. Deploy bertahap; siapkan prosedur rollback aplikasi dan database yang tidak bergantung pada membatalkan migration destruktif.

## Status verifikasi
Paket source dan sintaks smoke-test dapat diperiksa lokal. CI, build seluruh monorepo, test suite penuh, deployment Vercel, serta database produksi harus dijalankan oleh pemilik repo/environment; tidak dinyatakan lulus hanya karena workflow tersedia.
