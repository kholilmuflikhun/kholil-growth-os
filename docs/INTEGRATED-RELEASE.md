# Kholil Growth OS — Integrated Release (Starter + Phase 2–30)

## What is included

This bundle uses the Phase 30 cumulative source tree as the integration baseline. A structural comparison against the supplied Starter / Phase 2 archive found that all 42 Starter file paths are present in the cumulative tree; 13 shared files contain newer versions and 119 additional files are included. The result is one monorepo, not a stack of ZIPs to extract over one another.

- `apps/web`: public personal brand website (port 3000).
- `apps/gos`: private Growth Operating System dashboard (port 3001).
- `packages/`: shared UI, validation, and configuration packages.
- `prisma/`: PostgreSQL schema, committed migrations, bootstrap and seed scripts.
- `docs/`: phase notes and production checklist.

## Requirements

- Node.js 22 LTS.
- pnpm 10 (the repository declares `pnpm@10.0.0`).
- A PostgreSQL database for authenticated, database-backed features.

## First-time local setup

Run these commands from the repository root.

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install
cp .env.example .env
```

Edit `.env` before starting the applications. Set a valid PostgreSQL `DATABASE_URL`, a unique random `AUTH_SECRET` of at least 32 characters, and a different random `CRON_SECRET` of at least 32 characters. Keep all secrets private and never commit `.env`. Set the site URLs for local development as shown in `.env.example`.

Then generate the Prisma client and apply development migrations:

```bash
pnpm db:generate
pnpm db:migrate
pnpm admin:bootstrap
pnpm dev
```

The bootstrap script requires `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a strong `BOOTSTRAP_ADMIN_PASSWORD` in `.env`. Use it only for the initial administrator setup and do not expose bootstrap credentials in public deployment settings. If the project already has an administrator, follow the bootstrap script's own behavior and do not assume it will reset credentials.

Open:

- Public website: <http://localhost:3000>
- GOS dashboard: <http://localhost:3001>

To run each app separately, use separate terminals:

```bash
pnpm --filter @kholil/web dev
pnpm --filter @kholil/gos dev
```

## QA before deployment

```bash
pnpm production:check
pnpm qa
```

After both apps are running, run `pnpm smoke`. Set `WEB_HEALTH_URL` and `GOS_HEALTH_URL` when testing a deployed environment. Do not mark the release as production-ready unless tests, typecheck, lint, build, migration tests, and smoke tests have actually passed.

## Production deployment notes

1. Create a committed `pnpm-lock.yaml` using the project's pinned pnpm version. This supplied archive does not contain a lockfile; create it in an environment that can reach the package registry, review it, and commit it before CI/production deployment.
2. Use a managed PostgreSQL database and separate environment variables for local, staging, and production.
3. Test migrations against staging and take a verified backup before production migrations. Use `pnpm db:deploy` in production, not `pnpm db:migrate`.
4. Deploy `apps/web` and `apps/gos` as separate Vercel projects with correct root directories and environment variables. Follow `docs/PHASE-27.md` and `docs/PRODUCTION-CHECKLIST.md`.
5. Configure scheduled automation only after `CRON_SECRET` is set in Vercel and verify the cron endpoint in logs.
6. Configure Resend and/or WhatsApp Cloud API only if you intend to use external delivery. Without provider credentials, those external channels will not send messages.

## Integration validation performed for this bundle

- Starter / Phase 2 archive integrity: passed.
- Phase 30 archive integrity: passed.
- Starter file paths compared with Phase 30 tree: all present in the Phase 30 tree.
- Consolidated archive integrity: checked after packaging.
- Environment secret files (`.env`, `.env.local`, `.env.production`) are not included.

The working environment used to prepare this bundle could not download pnpm from the npm registry, so dependency installation, Prisma generation, full test suite, typecheck, lint, build, live database migrations, and Vercel deployment were **not** executed here. Treat those as required checks on your machine before production use.
