# Deployment Guide

## Runtime and package manager

- Node.js 22.18.0 or newer on the Node 22 line.
- pnpm 12.14.0 exactly.
- PostgreSQL supported by Prisma ORM 7.10.0.
- Use the committed `pnpm-lock.yaml` and `pnpm install --frozen-lockfile` for CI/production. The current work archive still needs the lockfile generated and committed before deployment.

## Environment

Set server-side environment variables separately for the two Vercel projects. Set `APP_TARGET=web` when running the preflight for the public website and `APP_TARGET=gos` for the private app; use `monorepo` for local validation of the combined environment. Never prefix secrets with `NEXT_PUBLIC_`.

GOS needs `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, and `PUBLIC_LEAD_API_SECRET`. The public website needs `GOS_API_URL`, `GOS_LEAD_API_SECRET`, `NEXT_PUBLIC_SITE_URL`, and its other site settings. The two lead-intake secrets must be exactly equal, generated randomly, and never exposed to browser code. `DIRECT_URL` is optional for Prisma CLI migrations when the runtime database URL uses a pooler.

## Build and migrations

1. Generate and review the pnpm lockfile in a network-enabled environment.
2. Run `pnpm install --frozen-lockfile`.
3. Set environment variables and run `pnpm db:generate`.
4. On a disposable development/staging database, run `pnpm db:migrate` and validate the migration path.
5. Run `pnpm qa:static`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e`.
6. Run `pnpm production:check:strict` against the exact production environment configuration.
7. Deploy the GOS app and public website as separate Vercel projects from the monorepo. Ensure each project uses the intended app root/build command and has access to required workspace packages.
8. Apply reviewed migrations with `pnpm db:deploy` from a controlled deployment job. Never run `prisma migrate reset` against production.
9. Verify health endpoints, login, public lead-to-CRM intake, service/product publication, payment idempotency, access denial for anonymous users, and financial totals.

## Database operations

- Keep `DATABASE_POOL_MAX` low for serverless deployments and verify aggregate connection capacity across instances.
- Back up before migrations and test restoration in a separate database.
- Do not automatically seed production with demo customers, revenue, payments, testimonials, or performance claims.
- Generated Prisma client files are ignored by Git and are produced by `pnpm db:generate` during setup/build.

## Deployment status

This source package has not been deployed or live-verified. Deployment must wait until the lockfile, automated checks, migrations, and staging smoke tests pass.
