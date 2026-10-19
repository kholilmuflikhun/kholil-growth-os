# Kholil Muflikhun — Personal Brand + Growth OS

> **Integrated bundle:** this repository consolidates the Starter / Phase 2 baseline and the cumulative source code through Phase 30. Start with [`docs/INTEGRATED-RELEASE.md`](docs/INTEGRATED-RELEASE.md) for the safest setup sequence. It is source-ready, but is not considered production-ready until the QA and deployment checklist passes in your own environment.

Monorepo starter for a public personal-brand website and private Growth Operating System.

## Stack

- pnpm workspaces + Turborepo
- Next.js App Router, React, TypeScript strict mode
- Tailwind CSS v4
- Lucide React
- Prisma + PostgreSQL schema
- Zod validation
- Next themes for light/dark mode

> This is a runnable starter implementation, not a deployed production service. Financial CRUD, payment integrations, email delivery, rate limiting, recovery, and production deployment still require further implementation. No default password is hardcoded.

## Requirements

- Node.js 22 LTS (or a newer supported LTS compatible with the installed Next.js version)
- pnpm
- PostgreSQL for database-backed features

## Run

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env`
3. Set `DATABASE_URL` to a PostgreSQL connection string
4. Start apps: `pnpm dev`
5. Public website: <http://localhost:3000>
6. GOS dashboard shell: <http://localhost:3001>

## Database

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed` (development only)

The included dashboard uses illustrative demo metrics until wired to authenticated database queries. Never use demo data as real business reporting.

## Security

- Do not deploy with the weak requested password `123456`.
- Use a secure bootstrap flow to create the first admin and require a unique password.
- Do not expose secrets in client-side variables.
- Review `docs/SECURITY.md` before deployment.

## Master prompt audit and roadmap

See [`docs/MASTER-PROMPT-AUDIT-AND-ROADMAP.md`](docs/MASTER-PROMPT-AUDIT-AND-ROADMAP.md) for the source-level audit, confirmed gaps, phased implementation plan, and exit criteria. The current approved brand palette is blue, white, gray, and black (`packages/ui/src/theme.css`); this follows the latest user decision and overrides older orange-accent notes. For environment setup, see [`docs/SETUP.md`](docs/SETUP.md) and copy `.env.example` to `.env`.

## Structure

- `apps/web`: public personal-brand site
- `apps/gos`: private dashboard shell
- `packages/ui`: shared components
- `packages/config`: shared TS configuration
- `packages/validation`: shared Zod schemas
- `prisma`: initial relational data model
- `docs`: setup, deployment, security notes

## Struktur Akar Repository Saat Ini

Berikut struktur utama repository sesuai file dan folder yang tersedia. File hasil build, cache, `node_modules`, dan file environment lokal sengaja tidak dicantumkan.

```text
kholil-growth-os/
├── .github/
│   └── workflows/
│       └── quality-gates.yml
├── .vscode/
│   └── settings.json
├── apps/
│   ├── gos/                    # Dashboard Growth Operating System privat (port 3001)
│   │   └── src/
│   │       ├── app/            # Halaman dashboard dan API routes
│   │       ├── components/
│   │       └── lib/
│   └── web/                    # Website personal brand publik (port 3000)
│       └── src/
│           ├── app/            # Halaman publik dan API routes
│           ├── components/
│           └── lib/
├── deploy/
│   ├── env.production.example  # Contoh variabel environment deployment
│   └── env.production          # Konfigurasi deployment; jangan publikasikan secret
├── docs/                       # Panduan setup, keamanan, deployment, fase, dan brand
│   └── brand/
├── packages/
│   ├── business-core/          # Formula finance, KPI, dan attribution
│   ├── config/                 # Konfigurasi ESLint dan TypeScript bersama
│   ├── database/               # Prisma client dan akses database bersama
│   ├── ui/                     # Komponen dan design tokens bersama
│   └── validation/             # Skema validasi bersama
├── prisma/
│   ├── migrations/             # Riwayat migrasi database
│   ├── bootstrap-admin.ts      # Membuat admin awal dari environment
│   ├── schema.prisma
│   └── seed.ts
├── scripts/                    # Preflight produksi, smoke test, dan static checks
├── tests/
│   └── e2e/                    # Playwright end-to-end tests
├── .env.example                # Template environment lokal
├── package.json                # Perintah workspace dan versi runtime
├── pnpm-lock.yaml              # Lockfile dependency workspace
├── pnpm-workspace.yaml
├── prisma7.config.ts
├── playwright.config.ts
└── turbo.json
```

### Klarifikasi Konfigurasi Repository

- `pnpm-lock.yaml` dan `.env.example` tersedia di root repository saat ini. Gunakan lockfile yang ada untuk instalasi reproducible; jangan mengganti atau membagikan `.env` lokal.
- Root `package.json` menetapkan Node.js `>=22.18.0` dan pnpm `>=12.7.0 <13`, dengan package manager yang dipatok ke pnpm `12.14.0`.
- Perintah workspace utama mencakup `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm qa`, `pnpm test:e2e`, `pnpm smoke`, dan `pnpm production:check`.
- Struktur di atas adalah ringkasan folder penting, bukan daftar setiap route atau file. Rincian modul dan prasyarat produksi ada di dokumentasi dalam `docs/`.

## Phase 1 / Starter — Foundation & Monorepo Setup

Dokumentasi fase: [`docs/PHASE-1.md`](docs/PHASE-1.md).

Membangun fondasi awal Kholil Muflikhun Personal Brand + Growth Operating System sebagai monorepo dengan dua aplikasi terpisah:

- `apps/web`: website publik personal brand, landing page, pengenalan layanan, CTA, serta dukungan tema light/dark.
- `apps/gos`: dashboard privat Growth OS sebagai fondasi workspace manajemen bisnis.
- `packages/ui`: komponen UI bersama agar tampilan kedua aplikasi konsisten.
- `packages/config`: konfigurasi TypeScript bersama.
- `packages/validation`: skema validasi awal berbasis Zod.
- `prisma`: fondasi skema data PostgreSQL dan seed pengembangan.
- pnpm workspaces + Turborepo untuk mengelola aplikasi dan paket bersama.
- Fondasi desain responsif, Tailwind CSS, Next.js App Router, React, dan TypeScript.

**Output Starter:** struktur repository, konfigurasi aplikasi, UI awal website publik dan dashboard, paket bersama, serta fondasi skema data. Starter adalah fondasi awal; autentikasi, modul operasional, dan fitur lanjutan ditambahkan pada fase berikutnya. Lihat juga [`docs/INTEGRATED-RELEASE.md`](docs/INTEGRATED-RELEASE.md) untuk urutan setup versi terintegrasi.

## Phase 2

See `docs/PHASE-2.md` for the secure admin bootstrap and lead API. The first admin is not pre-created; create it using a strong password from uncommitted environment variables.

## Phase 3

CRM, finance transaction entry, live dashboard aggregates, account settings and password change are documented in `docs/PHASE-3.md`.

## Phase 4 — Goals & Strategy, CSV Export

Dokumentasi fase: [`docs/PHASE-4.md`](docs/PHASE-4.md).

- Modul Goals & Strategy mendukung pembuatan goal berbasis database dan perubahan status melalui `/api/goals`.
- Ekspor CRM melalui `/api/leads/export` dengan proteksi sesi.
- Ekspor transaksi keuangan bulanan melalui `/api/finance/export?month=YYYY-MM` dengan proteksi sesi.
- CSV meng-escape tanda kutip dan menetralkan nilai yang dapat memicu formula spreadsheet.

## Phase 5 — Operational Modules: Projects, Content & KPI

Dokumentasi fase: [`docs/PHASE-5.md`](docs/PHASE-5.md).

- Projects & Orders mendukung pembuatan, daftar, perubahan status, penghapusan, anggaran proyek, dan tenggat.
- Content Planner mendukung pembuatan konten, perubahan status, serta tanggal terjadwal dan publikasi.
- KPI & Reports mendukung pencatatan hasil KPI dan ringkasan skor berbobot.
- Migrasi `202610150001_phase5_operations` menambahkan `Goal.description` dan `Project.customerName` opsional.
- Jalankan migrasi database sebelum menggunakan perubahan ini.

## Phase 6 — Project-to-Finance Integration

Dokumentasi fase: [`docs/PHASE-6.md`](docs/PHASE-6.md).

- Transaksi keuangan dapat ditautkan secara opsional ke proyek melalui `projectId`.
- Form Finance menyediakan pemilih proyek; riwayat transaksi menampilkan proyek terkait.
- Daftar proyek merangkum pemasukan dan pengeluaran tercatat yang ditautkan ke proyek.
- Ekspor CSV Finance menyertakan nama proyek.
- Migrasi `202610150002_project_finance_link` menambahkan relasi opsional dan indeks.
- Ringkasan realisasi per proyek hanya menghitung transaksi yang secara eksplisit ditautkan ke proyek.

## Phase 7 — Business Intelligence & Forecasting

Dokumentasi fase: [`docs/PHASE-7.md`](docs/PHASE-7.md).

- Halaman terlindungi `/analytics` menampilkan tren pemasukan/pengeluaran tercatat selama enam bulan, arus kas bersih, estimasi pipeline CRM terbuka, aktivitas bulan berjalan, skor KPI, dan proyeksi pencapaian target.
- Rekomendasi berbasis aturan transparan membantu menyoroti follow-up, pemeriksaan keuangan, dan pelaksanaan konten.
- Proyeksi merupakan ekstrapolasi sederhana berdasarkan laju bulan berjalan; angka adalah estimasi, bukan jaminan hasil.
- Dashboard tidak menggunakan target pendapatan bulanan hard-coded ketika tidak ada goal aktif. Buat goal pada `/goals` untuk mengaktifkan perhitungan progres target.
- Analitik membaca data PostgreSQL yang tersedia dan tidak memerlukan migrasi skema tambahan khusus untuk fase ini.

> Catatan: bagian Phase 1–7 merangkum riwayat fase pengembangan. Source code master merupakan baseline kumulatif; rincian perilaku dan batasan aktual tetap mengikuti implementasi, migrasi, serta hasil QA pada versi yang digunakan.

## Phase 8 — Reminders & Action Center

A protected `/reminders` page lets the owner create, prioritize, reschedule, complete, reopen, and delete reminders. Run `pnpm db:generate` and `pnpm db:migrate` after pulling this phase. In-app overdue indicators are included; external push/email/WhatsApp delivery is not configured in this phase.

## Phase 9 — Integrations & Notification Automation

The Notification Center (`/notifications`) shows in-app alerts created by the secured `/api/automation/dispatch` endpoint. Set `CRON_SECRET` in the deployment environment. If deploying `apps/gos` as the Vercel project root, its `vercel.json` runs dispatch daily at 09:00 WIB. External WhatsApp/email/push delivery is not configured.

## Phase 10 — AI Business Assistant

The protected `/assistant` page builds a rule-based daily briefing from current GOS data, including follow-ups, goal progress, financial records, and content activity. It does not call an external AI API or send messages automatically.

## Phase 11 — Revenue Growth Engine

The protected `/revenue` page models required monthly revenue, transaction count, and prospect count from editable assumptions, and compares them with recorded finance and CRM data. No schema migration is required for this phase.

## Phase 12 — Sales Pipeline & Proposal Management

Use `/proposals` to create and track proposal records tied to active CRM leads. Run `pnpm db:generate` and `pnpm db:migrate` after updating the source. Proposal acceptance does not automatically create a Finance income transaction.

## Phase 13 — Customer & Order Fulfillment

- Modul `/orders` untuk mengubah penawaran berstatus `ACCEPTED` menjadi order secara idempotent.
- Order menyimpan nama pelanggan, kontak, judul pekerjaan, nilai kontrak, status fulfillment, tanggal mulai/tenggat, dan catatan.
- Order dapat ditautkan ke proyek operasional yang sudah ada.
- API `/api/orders` menyediakan daftar, konversi, pembaruan status/jadwal/proyek, dan penghapusan dengan pemeriksaan sesi/role.
- Status fulfillment: `CONFIRMED`, `IN_PROGRESS`, `DELIVERED`, `CANCELLED`.
- Nilai order tidak otomatis dicatat sebagai pemasukan. Pembayaran aktual tetap dicatat terpisah di Finance untuk menjaga akurasi arus kas.
- Migration: `prisma/migrations/202610160004_orders/migration.sql`.

## Phase 14 — Customer Database & Payment Tracking

- Halaman `/customers` dan API `/api/customers` untuk database pelanggan.
- Halaman yang sama mencatat pembayaran uang muka/cicilan/pelunasan dan menghitung piutang order.
- API `/api/payments` menulis record pembayaran serta pemasukan Finance dalam satu transaksi database.
- Model `Payment`, relasi `Customer`–`Order`–`FinancialTransaction`, dan migration `202610160005_customer_payments`.
- Pembayaran dibatasi pada sisa tagihan; order dibatalkan tidak menerima pembayaran baru.

## Phase 15 — Profitability & Business Intelligence

- Business Intelligence menampilkan net per proyek dari transaksi Finance yang tertaut.
- Memantau total piutang order, daftar tagihan prioritas, dan kategori pemasukan tertinggi.
- Rekomendasi menyoroti piutang yang perlu ditagih serta proyek dengan biaya tercatat melebihi pemasukan tercatat.
- Dokumentasi: `docs/PHASE-15.md`.

## Phase 16 — Business Decision & Action Center

- `/actions` menyatukan tindakan manual dan rekomendasi prioritas berbasis data bisnis.
- Rekomendasi meliputi follow-up prospek, piutang jatuh tempo, proyek terlambat, pengingat terlambat, dan gap target pemasukan.
- Setiap tindakan memiliki kategori, prioritas, status, tenggat, dan tautan ke modul sumber.
- Migration: `prisma/migrations/202610160006_action_center`.
- Generator rekomendasi bersifat idempotent untuk setiap sumber; tidak ada pesan atau transaksi otomatis.

## Phase 17 — Daily Execution & Revenue Tracker

Open `/execution` in the GOS dashboard to log daily work, outcomes, time spent, and activity-attributed revenue/expenses. The tracker defaults to a Rp5,200,000 monthly target and 26 active days (Rp200,000/day); an active Goal overrides these defaults. Tracker amounts are attribution only and do not create Finance transactions. See `docs/PHASE-17.md`.

## Phase 18 — Weekly Business Review & Performance Coach

Open `/weekly-review` to compare the selected week against the prior seven days, review revenue, expenses, CRM, content, execution, overdue work, and get prioritized next-week recommendations. The API is read-only and uses existing records. See `docs/PHASE-18.md`.

## Phase 19 — Monthly Business Review & Strategic Planning

Open `/monthly-review` to review monthly Finance, CRM, pipeline, content, execution, KPIs, receivables, and overdue work. Save a persistent strategic plan per month with targets for revenue, leads, content, and three strategic focus areas. Apply the new migration before use. See `docs/PHASE-19.md`.

## Phase 20 — Client Retention & Recurring Revenue Engine

Open `/retention` to manage recurring customer service plans, renewal dates, follow-ups, and normalized MRR/ARR estimates. The new `CustomerCarePlan` model is related to Customer. Plans do not automatically create orders or finance transactions. Apply the migration before use; see `docs/PHASE-20.md`.

## Phase 21 — Client Lifecycle & Upsell Engine

Buka `/lifecycle` di dashboard GOS untuk melihat sinyal retensi/upsell dan mengelola pipeline peluang pelanggan. Rincian penggunaan serta migration tersedia di `docs/PHASE-21.md`. Jalankan `pnpm db:generate` dan `pnpm db:migrate` sebelum menjalankan aplikasi.

## Phase 22 — Revenue Forecast & Target Pacing

Buka `/forecast` untuk memantau target bulanan, realisasi pendapatan, proyeksi sederhana, sisa target, pipeline tertimbang, dan MRR estimasi. Tidak membutuhkan migration database baru. Perhitungan dan batasan dicatat di `docs/PHASE-22.md`.

## Phase 23 — Automated Daily Business Briefing

Buka `/daily-briefing` pada aplikasi GOS untuk melihat target harian/bulanan, prospek yang perlu ditindaklanjuti, piutang, proyek, konten terjadwal, layanan berulang, dan rekomendasi tindakan. Tombol **Buat tindakan hari ini** menambahkan tugas ke Action Center dengan kunci sumber per tanggal untuk membantu menghindari duplikasi. Fitur ini menghasilkan briefing saat dibuka; belum mengirim email/WhatsApp/push otomatis. Detail: `docs/PHASE-23.md`.

## Phase 24 — Automated Notification & Reminder Engine

See `docs/PHASE-24.md` for upcoming/overdue reminder notifications, cron setup, `CRON_SECRET`, and limitations.

## Phase 25 — External Notification Delivery

Optional email notifications use Resend; optional WhatsApp notifications use Meta WhatsApp Cloud API. Configure provider environment variables as documented in `docs/PHASE-25.md`, then test from **Settings → Kanal notifikasi eksternal**. Existing in-app notifications remain available when external providers are not configured.

## Phase 26 — Security & Reliability

See [`docs/PHASE-26.md`](docs/PHASE-26.md) for security headers, automated unit tests, and the production-readiness checklist. Run `pnpm --filter @kholil/gos test` before deployment.

## Phase 27 — Production Deployment & Database Readiness

- Jalankan `pnpm production:check` untuk pemeriksaan environment dasar dan `pnpm production:check:strict` sebelum deploy production.
- `pnpm db:deploy` menjalankan migration yang sudah di-commit pada database target; pastikan backup tersedia terlebih dahulu.
- Health check: `/api/health` di kedua aplikasi. Health check GOS juga menguji koneksi database.
- Panduan dua project Vercel, environment, staging, migration, smoke test, dan batasan ada di [`docs/PHASE-27.md`](docs/PHASE-27.md).

## Phase 28 — Advanced Analytics & Business Intelligence

- Halaman `/analytics` menyajikan tren pendapatan/biaya enam bulan, analisis kategori, ringkasan target, MRR, pipeline, konversi prospek, dan pelanggan berdasarkan pembayaran tercatat.
- API privat `GET /api/analytics` menyediakan ringkasan analitik berbasis sesi login.
- Rekomendasi adalah aturan transparan yang didasarkan pada data yang dicatat, bukan jaminan atau prediksi AI.
- Detail definisi metrik dan batasan ada di [`docs/PHASE-28.md`](docs/PHASE-28.md).

## Phase 29 — Sales Conversion & Profitability Optimization

Buka `/sales-optimization` untuk meninjau konversi CRM/proposal, profitabilitas indikatif kategori/proyek, dan rekomendasi tindakan berbasis data tercatat. API JSON terautentikasi tersedia di `/api/sales-optimization`. Detail: `docs/PHASE-29.md`.

## Phase 30 — Final Integration, QA & Production Readiness

- `pnpm qa` menjalankan generate Prisma client, test, typecheck, lint, dan build.
- GitHub Actions quality gates tersedia pada `.github/workflows/quality-gates.yml`.
- `pnpm smoke` memeriksa health endpoints website dan dashboard; URL dapat diatur melalui `WEB_HEALTH_URL` dan `GOS_HEALTH_URL`.
- Sebelum produksi, ikuti [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) dan [`docs/PHASE-30.md`](docs/PHASE-30.md).
- CI/build/deployment belum dianggap lulus sampai hasil nyata tersedia. Buat dan commit `pnpm-lock.yaml`, lalu ubah CI ke frozen lockfile sebelum rilis produksi.

## Public Service Catalog (added)

The public website now includes a searchable/filterable service catalog, five featured packages, individual service detail pages, demonstration portfolio concepts, and a quote request form that forwards leads to the separate private Growth OS deployment. See `docs/PUBLIC-CATALOG-IMPLEMENTATION.md` for domain, environment, security, and deployment instructions. Numeric prices are indicative starting prices and should be confirmed before launch.

## CRM Lead Detail

CRM detail implementation, pipeline probability, activity history, follow-up scheduling, and migration notes are documented in [`docs/CRM-LEAD-DETAIL.md`](docs/CRM-LEAD-DETAIL.md). Apply the new migration and regenerate Prisma Client before deployment.

## Brand voice & shared design system

- Brand Voice & Marketing Playbook v2.0: [`docs/brand/VOICE-KIT.md`](docs/brand/VOICE-KIT.md) — professional/formal voice, customer journey, Marketing 5.0, CTA, claim substantiation, AI and data responsibility.
- Shared visual system: [`docs/brand/DESIGN-SYSTEM.md`](docs/brand/DESIGN-SYSTEM.md)
- Shared design tokens: `packages/ui/src/theme.css`
- Shared UI primitives: `packages/ui/src/index.tsx`

Both `apps/web` and `apps/gos` import the same shared theme tokens. The applications remain separate public/private products.

## Responsive UI/UX

See `docs/UX-IMPLEMENTATION.md` for the public mobile menu, Growth OS navigation, dashboard quick actions, and responsive layout changes.

### Brand palette update

The shared visual system uses a professional blue, white, gray, and black palette. See `docs/brand/DESIGN-SYSTEM.md` and `docs/brand/VOICE-KIT.md` for the exact color tokens and usage rules.

## Roadmap lanjutan Phase 31–60

Roadmap rekomendasi setelah baseline Phase 1–30 tersedia di [`docs/ROADMAP-PHASE-31-60.md`](docs/ROADMAP-PHASE-31-60.md). Phase 31–60 adalah rencana pengembangan, bukan fitur yang sudah diimplementasikan. Audit repository, acceptance criteria, dan QA harus dilakukan sebelum setiap fase dimulai.

## Current implementation status

- [Audit and phase 1–5 implementation status](docs/IMPLEMENTATION-STATUS-2026-10-18.md)
- [Local setup and developer workflow](docs/SETUP.md)
- [Security guidance](docs/SECURITY.md)
- [Deployment guide](docs/DEPLOYMENT.md)

The repository now targets Next.js 16 / React 19 and Prisma ORM 7 with a PostgreSQL driver adapter. The generated Prisma client is intentionally excluded from source control and is created by `pnpm db:generate`. A committed `pnpm-lock.yaml` is still required before CI can pass the reproducibility gate. Full build, typecheck, lint, unit tests, Playwright tests, database migration and deployment remain unverified until executed in a network-enabled environment.

## Changelog

### 2026-10-19 — Dokumentasi struktur repository

- Menambahkan peta struktur root yang mengikuti workspace, aplikasi, package bersama, konfigurasi, dokumentasi, database, script, dan test yang tersedia.
- Menambahkan klarifikasi keberadaan lockfile, template environment, persyaratan runtime, serta perintah workspace berdasarkan konfigurasi repository saat ini.
- Tidak mengubah fitur aplikasi atau mengklaim bahwa QA dan deployment produksi telah lulus.

### 2026-10-18 — Baseline integrasi v2.4 / Phase 30

- Mengintegrasikan source website publik dan dashboard Growth Operating System hingga baseline Phase 30.
- Melengkapi integrasi katalog publik, CRM lead detail, operasi pelanggan dan pembayaran, analitik, serta dokumentasi keamanan dan deployment.
- Menyertakan roadmap Phase 31–60 sebagai rencana lanjutan; fase tersebut bukan fitur yang sudah diimplementasikan.
- Status implementasi dan batasan verifikasi tersedia di [`docs/IMPLEMENTATION-STATUS-2026-10-18.md`](docs/IMPLEMENTATION-STATUS-2026-10-18.md) dan [`docs/MASTER-RELEASE-v2.4.md`](docs/MASTER-RELEASE-v2.4.md). Baseline source tidak dengan sendirinya berarti siap produksi.
