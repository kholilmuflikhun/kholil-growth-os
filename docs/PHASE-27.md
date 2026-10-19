# Phase 27 — Production Deployment & Database Readiness

Phase ini menambahkan alat pemeriksaan konfigurasi dasar dan endpoint health check. Ini menyiapkan deployment, tetapi tidak melakukan deployment otomatis atau mengklaim layanan produksi telah aktif.

## Perubahan
- `pnpm production:check`: memvalidasi environment dasar dari root monorepo.
- `pnpm production:check:strict`: memvalidasi dengan asumsi production (HTTPS wajib, DB tidak boleh localhost).
- `pnpm db:deploy`: menjalankan migration yang sudah di-commit menggunakan `prisma migrate deploy`.
- `GET /api/health` pada GOS menguji koneksi PostgreSQL dan hanya mengembalikan status umum, tanpa detail error sensitif.
- `GET /api/health` pada website publik menguji status aplikasi web.
- `deploy/env.production.example`: daftar variabel untuk konfigurasi manual pada Vercel; tidak berisi secret nyata.

## Vercel monorepo setup

Gunakan dua Vercel projects dari repository yang sama:

### Project A — Public website
- Root Directory: `apps/web`.
- Aktifkan **Include source files outside of the Root Directory in the Build Step**, karena workspace packages dan Prisma schema berada di root monorepo.
- Install Command: `cd ../.. && pnpm install`.
- Build Command: `cd ../.. && pnpm --filter @kholil/web build`.
- Pastikan output Next.js tetap mengikuti default framework detection.
- Set `NEXT_PUBLIC_SITE_URL` ke domain publik dan `NEXT_PUBLIC_GOS_URL` serta `GOS_API_URL` ke domain project GOS.

### Project B — Private GOS dashboard
- Root Directory: `apps/gos`.
- Aktifkan **Include source files outside of the Root Directory in the Build Step**.
- Install Command: `cd ../.. && pnpm install`.
- Build Command: `cd ../.. && pnpm --filter @kholil/gos build`.
- Pastikan `apps/gos/vercel.json` ikut terdeteksi oleh project ini agar cron `/api/automation/dispatch` terpasang.
- Set `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, dan `NEXT_PUBLIC_GOS_URL` pada environment yang tepat. Provider secrets hanya dibutuhkan jika kanal tersebut digunakan.

> Vercel UI dan konfigurasi monorepo dapat berubah. Verifikasi command berjalan dari working directory project saat deployment pertama. Repo ini saat ini tidak menyertakan `pnpm-lock.yaml`; buat dan commit lockfile dari environment Node/pnpm yang ditetapkan sebelum deployment production agar versi dependency reproducible. Jangan memakai `--frozen-lockfile` sampai lockfile tersedia dan sinkron.

## Urutan deploy yang disarankan
1. Buat PostgreSQL managed terpisah untuk staging dan production. Gunakan user database least-privilege, TLS bila didukung, dan backup terjadwal.
2. Buat secrets acak yang berbeda untuk `AUTH_SECRET` dan `CRON_SECRET` (minimal 32 karakter). Jangan menggunakan nilai contoh.
3. Jalankan `pnpm install`, `pnpm db:generate`, `pnpm --filter @kholil/gos test`, `pnpm typecheck`, `pnpm lint`, dan `pnpm build` secara lokal/CI.
4. Jalankan `pnpm production:check:strict` dengan env staging/production yang sesuai.
5. Terapkan migration ke staging menggunakan `pnpm db:deploy` dengan `DATABASE_URL` staging. Verifikasi backup dan pemulihan sebelum produksi.
6. Deploy GOS terlebih dahulu, lalu verifikasi `/api/health`, login, CRUD, cron dan provider notification. Endpoint health GOS menguji koneksi DB.
7. Deploy website publik; verifikasi `/api/health`, formulir kontak/lead, URL tujuan CTA, dark mode, mobile layout, dan tautan ke dashboard.
8. Jalankan migration produksi hanya setelah backup terbaru dan persetujuan deploy: `pnpm db:deploy` dengan `DATABASE_URL` produksi.
9. Jalankan smoke tests sesudah deployment dan periksa logs. Uji rollback/recovery dengan prosedur provider/database, bukan dengan menghapus data produksi.

## Health checks
- Website: `https://<domain-publik>/api/health` → HTTP 200 dan `status: ok` bila app merespons.
- GOS: `https://<domain-gos>/api/health` → HTTP 200 jika app dan DB terhubung, HTTP 503 jika DB tidak tersedia.
- Jangan menganggap health check sebagai tes lengkap autentikasi atau business logic.

## Limitations / security notes
- File ini tidak melakukan login ke akun Vercel, membuat project, mengatur domain, membuat database hosted, atau mengunggah environment secrets.
- Tidak ada URL produksi yang diasumsikan. Deployment memerlukan tindakan pemilik akun dan provider.
- Public health endpoint GOS hanya mengungkap status database secara umum; jangan menambahkan pesan exception, URL DB, atau secrets ke response.
- Preflight memeriksa format dan nilai environment secara statis; tidak mencoba koneksi database atau memverifikasi credentials eksternal.
- Build, lint, typecheck, tests, live migrations, and deployment have to be run in target environment before production use.
