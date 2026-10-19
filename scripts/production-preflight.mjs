#!/usr/bin/env node
import "dotenv/config";
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const envFile = resolve(root, '.env');

if (!existsSync(resolve(root, 'prisma/schema.prisma'))) errors.push('File prisma/schema.prisma tidak ditemukan. Jalankan script dari root monorepo.');
if (!existsSync(resolve(root, 'pnpm-workspace.yaml'))) errors.push('pnpm-workspace.yaml tidak ditemukan. Jalankan script dari root monorepo.');
if (!existsSync(resolve(root, 'pnpm-lock.yaml'))) { const message = 'pnpm-lock.yaml belum ada. Buat dan commit lockfile agar dependency build reproducible.'; if (isProduction) errors.push(message); else warnings.push(message); }
if (existsSync(envFile) && isProduction) warnings.push('File .env lokal terdeteksi. Pastikan file ini tidak pernah di-commit atau diunggah ke repository.');

function required(name, predicate, message) {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} wajib diisi${message ? `: ${message}` : ''}.`);
  else if (predicate && !predicate(value)) errors.push(`${name} tidak valid${message ? `: ${message}` : ''}.`);
  return value;
}
const isUrl = (v) => { try { new URL(v); return true; } catch { return false; } };
const isStrongSecret = (v) => v.length >= 32 && !/^(change.?me|replace.?me|your.?secret|secret|password|example)/i.test(v);
const target = process.env.APP_TARGET?.trim() || "monorepo";
if (!["web", "gos", "monorepo"].includes(target)) errors.push('APP_TARGET harus web, gos, atau monorepo.');
const needsGos = target === "gos" || target === "monorepo";
const needsWeb = target === "web" || target === "monorepo";
const databaseUrl = needsGos ? required('DATABASE_URL', (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), 'gunakan URL PostgreSQL yang valid') : process.env.DATABASE_URL;
const authSecret = needsGos ? required('AUTH_SECRET', isStrongSecret, 'gunakan rahasia acak minimal 32 karakter') : process.env.AUTH_SECRET;
const cronSecret = needsGos ? required('CRON_SECRET', isStrongSecret, 'gunakan rahasia acak minimal 32 karakter') : process.env.CRON_SECRET;
if (authSecret && cronSecret && authSecret === cronSecret) errors.push('AUTH_SECRET dan CRON_SECRET harus berbeda.');

const siteUrl = required('NEXT_PUBLIC_SITE_URL', isUrl, 'gunakan URL lengkap');
if (siteUrl && isProduction && !siteUrl.startsWith('https://')) errors.push('NEXT_PUBLIC_SITE_URL harus memakai HTTPS saat production.');
if (needsGos) {
  const gosUrl = required('NEXT_PUBLIC_GOS_URL', isUrl, 'gunakan URL lengkap aplikasi GOS');
  if (gosUrl && isProduction && !gosUrl.startsWith('https://')) errors.push('NEXT_PUBLIC_GOS_URL harus memakai HTTPS saat production.');
}
if (needsWeb) {
  const gosApiUrl = required('GOS_API_URL', isUrl, 'gunakan URL lengkap API GOS');
  if (gosApiUrl && isProduction && !gosApiUrl.startsWith('https://')) errors.push('GOS_API_URL harus memakai HTTPS saat production.');
  required('GOS_LEAD_API_SECRET', isStrongSecret, 'gunakan shared secret acak minimal 32 karakter');
}
if (needsGos) required('PUBLIC_LEAD_API_SECRET', isStrongSecret, 'gunakan shared secret acak minimal 32 karakter');
const publicLeadSecret = process.env.PUBLIC_LEAD_API_SECRET?.trim();
const webLeadSecret = process.env.GOS_LEAD_API_SECRET?.trim();
if (target === "monorepo" && publicLeadSecret && webLeadSecret && publicLeadSecret !== webLeadSecret) errors.push('GOS_LEAD_API_SECRET dan PUBLIC_LEAD_API_SECRET harus memiliki nilai yang sama.');
const poolMax = process.env.DATABASE_POOL_MAX?.trim();
if (poolMax && (!Number.isInteger(Number(poolMax)) || Number(poolMax) < 1 || Number(poolMax) > 50)) errors.push('DATABASE_POOL_MAX harus berupa bilangan bulat 1–50.');
if (!process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim()) warnings.push('BOOTSTRAP_ADMIN_PASSWORD kosong. Ini normal setelah admin dibuat; jangan mengaktifkan bootstrap publik atau menyimpan password awal di deployment.');
if (!process.env.RESEND_API_KEY) warnings.push('Email eksternal belum dikonfigurasi (RESEND_API_KEY).');
if (!process.env.WHATSAPP_CLOUD_API_TOKEN) warnings.push('WhatsApp Cloud API belum dikonfigurasi.');

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.pathname || parsed.pathname === '/') warnings.push('DATABASE_URL belum tampak memiliki nama database. Periksa koneksi PostgreSQL.');
    if (isProduction && /localhost|127\.0\.0\.1/i.test(parsed.hostname)) errors.push('DATABASE_URL masih menunjuk ke localhost pada mode production.');
  } catch { /* handled by required validator */ }
}

console.log(`\nGrowth OS Production Preflight (${isProduction ? 'PRODUCTION' : 'LOCAL/STAGING'})`);
console.log('='.repeat(48));
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`ERROR ${error}`);
if (!errors.length) console.log('\nLulus validasi environment dasar. Ini bukan bukti bahwa DB, provider, build, atau deployment sudah berfungsi.');
else console.log(`\nGagal: ${errors.length} masalah wajib perlu diperbaiki.`);
process.exitCode = errors.length ? 1 : 0;
