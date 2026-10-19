# Master Prompt Audit & Implementation Roadmap

**Project:** Kholil Muflikhun — Personal Brand + Growth Operating System  
**Baseline audited:** `kholil-growth-os-master-voice-kit-v2.1-blue-palette.zip`  
**Audit date:** 18 October 2026  
**Audit stage:** Phase 1 — repository and architecture audit  
**Important:** This is a source-level audit. A complete install, production build, live database test, browser test, or deployment was not possible in the audit environment; none is claimed here.

## 1. Product decisions to preserve

1. Keep `apps/web` and `apps/gos` as separate applications within the same monorepo. They may deploy independently.
2. Keep the public website focused on acquisition, credibility, services, portfolio, content, and lead conversion.
3. Keep GOS private and focused on operations, CRM, goals, content, finance, projects, KPI, and reporting.
4. Keep PostgreSQL and Prisma as the intended persistence layer.
5. Preserve Indonesian as the default language and support future internationalization.
6. **Visual palette precedence:** the user's most recent explicit decision is **blue, white, gray, and black**. This overrides the older orange-accent instruction that remains in the pasted master prompt. Current tokens in `packages/ui/src/theme.css` already use blue `#2563EB`, hover blue `#1D4ED8`, white `#FFFFFF`, gray `#F3F4F6` / `#D1D5DB`, and ink `#111827`.
7. Never invent customer testimonials, client results, revenue, payments, credentials, or deployment status.
8. The Rp200,000/day and 26 active days baseline remains configurable and must not be embedded as a fixed business rule.

## 2. Repository findings

### Existing foundation

- `apps/web`: Next.js App Router public site, service catalog routes, contact form endpoint, sitemap/robots, theme support, portfolio/service components.
- `apps/gos`: separate Next.js App Router application with login, dashboard, CRM/leads, customers, goals, finance, projects, content, orders, proposals, reminders, reports, notifications, and additional operational modules.
- `packages/ui`: shared theme tokens and UI primitives.
- `packages/validation`: shared Zod lead schema.
- `packages/config`: shared TypeScript/lint configuration.
- `prisma/schema.prisma`: current relational models for users, leads, customers, services, goals, financial transactions, projects, content, KPI results, reminders, notifications, proposals, orders, payments, action items, daily execution, monthly plans, customer care, and client opportunities.
- Existing migrations and docs include CRM lead detail, operational modules, security, UX, deployment and release notes.
- Authentication uses a signed JWT in an HTTP-only cookie and has a protected admin bootstrap script. The bootstrap script refuses weak passwords and hashes the supplied password.
- Public website lead submissions are forwarded server-to-server to GOS with a shared secret when configured.
- The dashboard already has responsive mobile navigation and a shared blue design system.

### Confirmed gaps / risks

1. **No `pnpm-lock.yaml` in the audited archive.** Dependency resolution is not reproducible yet.
2. **Dependencies use `latest` in package manifests.** This does not satisfy the requirement to pin and verify mutually compatible stable versions.
3. **Toolchain validation blocked in this environment.** Node.js `v22.16.0` is installed, but `pnpm` is not installed and Corepack could not download pnpm because network/DNS access to the npm registry was unavailable.
4. **Automated test coverage is limited.** Only two test files were found in the source tree (`security-utils.test.ts` and `catalog.test.ts`); this is not enough for the stated acceptance criteria.
5. **Public website route coverage is incomplete relative to the target specification.** Current route tree includes homepage, service detail, privacy, contact API, sitemap, and robots; dedicated About, product catalog/detail, portfolio index/detail, articles, contact page, terms, and SEO content routes are not all present as route files.
6. **The GOS has many operational modules, but presence of a route does not prove end-to-end correctness.** Financial reconciliation, authorization for every mutation, transactional consistency, CSV export authorization, and cross-module data attribution require tests.
7. **Production security remains unverified.** Rate limiting, login throttling, recovery flow, CSRF posture, security headers/CSP, upload permissions, dependency vulnerability checks, audit logging completeness, backup/restore, and alert delivery must be reviewed against actual deployment configuration.
8. **Authentication architecture needs a deliberate review.** Session JWT verification is present, but all API routes and server-side mutations must be checked for consistent authorization; middleware redirects are not a substitute for API-level authorization.
9. **No production build, full typecheck, lint run, database migration test, E2E run, or live deployment was performed in this audit.**
10. **External integrations are configuration-dependent.** Email, payment, social analytics, file storage, and notification delivery must be marked unavailable until credentials, permissions, and tests prove the integration works.

## 3. Phase plan and exit criteria

### Phase 1 — Repository audit and architecture (current)
- [x] Identify application and package boundaries.
- [x] Inventory route files, Prisma models, migrations, tests, and documentation.
- [x] Record visual-palette precedence and existing product decisions.
- [x] Identify build reproducibility and security validation gaps.
- [ ] Run dependency resolution and full QA in an environment with registry/network access.

**Exit condition:** findings and next steps documented; no production-readiness claim.

### Phase 2 — Reproducible foundation and security baseline
1. Select compatible stable versions based on the current official release matrix.
2. Pin direct dependencies and generate/commit `pnpm-lock.yaml`.
3. Add root-level validation for env variables, formatting, and dependency policy.
4. Test Prisma migrations against a disposable PostgreSQL database.
5. Review login throttling, session invalidation, password change/recovery, role checks, public form anti-spam, API error behavior, and security headers.
6. Add CI checks for install, typecheck, lint, unit tests, and production builds.

**Exit condition:** clean lockfile install and repeatable QA pass in CI.

### Phase 3 — Public website conversion slice
1. Complete core routes and metadata: About, Services, Portfolio, Products, Articles, Contact, Privacy, Terms.
2. Ensure all content that should be managed by GOS is stored in the database or an explicitly documented CMS/content source.
3. Validate contact form server-side, add rate limiting/anti-spam, and prove a valid submission persists as a CRM lead.
4. Keep the blue/white/gray/black palette consistent in light and dark themes.
5. Add accessible keyboard flows and responsive tests.

**Exit condition:** public pages render, content is truthful, and lead submission is verified end to end.

### Phase 4 — GOS core business slice
Implement and test one coherent path before expanding breadth:
`Lead → Customer → Quote → Order → Payment → Project → Finance/reporting`.

1. Verify CRUD and authorization for each record.
2. Use decimal-safe monetary fields and transactional updates.
3. Reconcile invoice/order totals, payments, refunds, receivables, and cash flow.
4. Clearly distinguish revenue, cash collected, receivables, gross profit, net operating profit, and owner withdrawals.
5. Ensure dashboard metrics query real data and show “Belum ada data” when empty.

**Exit condition:** integration tests prove records and financial summaries stay consistent.

### Phase 5 — Strategy, content, KPI and attribution
1. Link objective → initiative → project/task → KPI → outcome.
2. Support configurable goals, periods, units, currency, active days, and time zone.
3. Connect content/campaigns to leads and orders through a documented attribution model.
4. Label forecasts as estimates and disclose assumptions.

**Exit condition:** unit and integration tests cover formulas, attribution and missing-data cases.

### Phase 6 — QA, privacy, operations and release
1. Add Playwright coverage for public flows, admin access, CRUD, finance, mobile nav, and light/dark modes.
2. Test direct API access when unauthenticated and role-restricted.
3. Add audit log coverage for sensitive mutations.
4. Document backup/restore and perform a restore test.
5. Run production builds and security checks.
6. Verify deployment URLs and environment configuration before calling it deployed.

**Exit condition:** acceptance checklist passes, or remaining gaps are explicitly listed with severity and owner.

## 4. Recommended first vertical slice

Prioritize a complete and secure business path over adding more disconnected modules:

1. Public service inquiry form.
2. Server-to-server lead intake with rate limiting, schema validation and secret validation.
3. CRM lead list/detail/activity history.
4. Lead conversion to customer without duplicate records.
5. Quote and order with line items and clear status transitions.
6. Payment entry with idempotency and transaction safety.
7. Project creation from an accepted order.
8. Finance/report summary that reconciles recognized revenue, cash collected, receivables, costs and expenses separately.

## 5. Environment and execution notes

The audit environment reported Node.js `v22.16.0`. `pnpm` was not available, and `corepack pnpm -v` failed while trying to fetch pnpm from the npm registry due to a network/DNS error. Therefore dependency installation and QA were not attempted further, and no lockfile was generated. Use a network-enabled environment to pin compatible stable versions and create the lockfile; do not fabricate or hand-write a lockfile.

## 6. Current status

- Repository audit: **completed at source-inspection level**.
- Implementation of the full master prompt: **in progress / not complete**.
- Build/typecheck/lint/tests: **not verified in this environment**.
- PostgreSQL integration and migrations: **not verified in this environment**.
- Production security review: **not complete**.
- Deployment: **not performed or verified**.

## Update implementasi 18 Oktober 2026

Implementasi lanjutan untuk audit dan fase 1–5 kini dicatat di [`IMPLEMENTATION-STATUS-2026-10-18.md`](IMPLEMENTATION-STATUS-2026-10-18.md). Perubahan meliputi migrasi ke Prisma ORM 7 dengan adapter PostgreSQL, package database/business-core, sesi yang dapat dicabut dan pembatasan login, header keamanan, katalog layanan/produk, kampanye dan UTM, consent lead, transaksi order/pembayaran yang lebih aman, formula keuangan dan KPI yang dapat diuji, halaman publik tambahan, serta smoke tests Playwright.

**Penting:** source-level syntax scan lulus, tetapi build/typecheck/lint/test/database migration/e2e/deployment belum diverifikasi. `pnpm-lock.yaml` masih harus dibuat di lingkungan yang memiliki akses registry dan di-commit; CI sengaja memblokir build tanpa lockfile tersebut. Lihat status implementasi untuk daftar gap yang belum selesai.
