# Phase 1 / Starter — Foundation & Monorepo Setup

## Tujuan
Membangun fondasi awal **Kholil Muflikhun Personal Brand + Growth Operating System** dalam satu repository monorepo, dengan aplikasi publik dan dashboard privat yang terpisah tetapi berbagi konfigurasi serta komponen.

## Ruang lingkup Starter
- `apps/web`: website publik personal brand, landing page, pengenalan layanan, CTA, dan fondasi tema light/dark.
- `apps/gos`: aplikasi dashboard privat sebagai fondasi workspace Growth OS.
- `packages/ui`: komponen UI bersama untuk menjaga konsistensi tampilan.
- `packages/config`: konfigurasi TypeScript bersama.
- `packages/validation`: skema validasi bersama berbasis Zod.
- `packages/database` dan `prisma`: akses database serta model relasional PostgreSQL yang digunakan oleh aplikasi.
- pnpm workspaces dan Turborepo untuk pengelolaan monorepo.
- Next.js App Router, React, TypeScript, Tailwind CSS, dan layout responsif.
- Konfigurasi environment melalui `.env.example`; nilai rahasia aktual tidak boleh dimasukkan ke repository.

## Output Starter
- Struktur repository untuk dua aplikasi dan paket bersama.
- Konfigurasi build dan pengembangan awal.
- UI awal website publik dan dashboard.
- Fondasi desain bersama dan skema data.
- Dokumentasi setup untuk pengembangan lokal.

## Batasan
Starter adalah fondasi, bukan aplikasi bisnis yang seluruh fiturnya sudah selesai. Autentikasi, CRM, transaksi keuangan, proyek, KPI, analitik, dan fitur lanjutan berasal dari fase berikutnya. Tampilan awal atau keberadaan route tidak otomatis membuktikan bahwa seluruh alur produksi telah diuji.

## Setup awal
1. Pastikan versi Node.js dan pnpm sesuai versi yang dicantumkan di `package.json` dan `docs/SETUP.md`.
2. Salin `.env.example` menjadi `.env`, lalu isi nilai untuk lingkungan lokal.
3. Install dependensi setelah `pnpm-lock.yaml` tersedia dan konsisten dengan manifest.
4. Siapkan PostgreSQL, lalu jalankan generate dan migrasi database sesuai petunjuk `docs/SETUP.md`.
5. Jalankan aplikasi lokal dan periksa kedua aplikasi secara terpisah.

Lihat juga:
- [`SETUP.md`](SETUP.md)
- [`INTEGRATED-RELEASE.md`](INTEGRATED-RELEASE.md)
- [`IMPLEMENTATION-STATUS-2026-10-18.md`](IMPLEMENTATION-STATUS-2026-10-18.md)

## Kriteria penerimaan
- Struktur monorepo dan workspace dapat dibaca oleh pnpm.
- Environment sample tidak berisi secret nyata.
- Kedua aplikasi dapat dikonfigurasi untuk berjalan lokal.
- Paket bersama dapat diimpor oleh aplikasi yang memerlukannya.
- Hasil instalasi, typecheck, lint, test, dan build diverifikasi di lingkungan dengan dependensi serta akses database yang diperlukan.

> **Status:** dokumen ini menjelaskan baseline Starter. Verifikasi penuh runtime/build harus mengacu pada hasil QA untuk versi source code yang sedang digunakan.
