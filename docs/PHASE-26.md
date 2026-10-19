# Phase 26 — Automated Testing, Security & Reliability

## Delivered
- Added reusable helpers for strong automation secrets, exact Bearer-token validation, and CSV formula-injection protection.
- Phase 24/25 automation dispatch now rejects missing, placeholder, or weak `CRON_SECRET` values. Use a random secret of at least 32 characters.
- Added baseline security response headers to both Next.js apps: content-type sniffing protection, frame denial, referrer policy, permissions policy, opener isolation, and HSTS in production.
- Added Vitest configuration and unit tests for security helpers.
- Added a production readiness checklist below.

## Run checks
From the monorepo root:

```bash
pnpm install
pnpm db:generate
pnpm --filter @kholil/gos test
pnpm typecheck
pnpm lint
pnpm build
```

Run against a disposable/test database before running migrations in production. Do not point automated tests at production data.

## Production readiness checklist
- [ ] Set unique `AUTH_SECRET` (32+ random characters) and `CRON_SECRET` (32+ random characters).
- [ ] Set production `DATABASE_URL`; use managed backups and a least-privilege DB user.
- [ ] Configure provider secrets only in deployment environment, never commit `.env`.
- [ ] Run Prisma migrations in staging, verify backup/restore, then deploy.
- [ ] Configure provider-level/WAF rate limits for login and public endpoints.
- [ ] Verify role-based access, session expiry, password change, CSV exports, and external notification delivery in staging.
- [ ] Review logs for sensitive data and verify error responses do not leak secrets.
- [ ] Run dependency audit and resolve high/critical findings before public launch.
- [ ] Test rollback and recovery procedure.

## Important limits
This phase adds baseline hardening and unit tests, not a full security audit. In-memory rate limiting is intentionally not used because serverless instances do not share state. Provider/WAF rate limiting and live end-to-end tests must be configured in the deployment environment. Build, typecheck, lint, and tests must be run in the target environment before production.
