# Local Setup & Developer Workflow

## Requirements

- Node.js 22.18.0 or newer is required for the pinned stack. Use Node 22 LTS and keep it patched.
- Use pnpm 12.14.0, matching `packageManager` in the root `package.json`.
- PostgreSQL supported by Prisma ORM 7.10.0. Prisma 7 uses a PostgreSQL driver adapter and a generated client under `packages/database/generated`.

## First setup

1. Install the exact pnpm version declared in `package.json` using Corepack or your team's approved package-manager installation process.
2. Run `pnpm install`. Review and commit the generated `pnpm-lock.yaml`; do not hand-write a lockfile. CI intentionally blocks until this lockfile is committed.
3. Copy `.env.example` to `.env` and replace every placeholder. Generate independent random values for `AUTH_SECRET` and `CRON_SECRET`; generate a separate shared secret for `GOS_LEAD_API_SECRET` and `PUBLIC_LEAD_API_SECRET` and set the same value in both app environments.
4. Start PostgreSQL and create an empty development database matching `DATABASE_URL`.
5. Run `pnpm db:generate` and `pnpm db:migrate`. The Prisma 7 CLI reads `prisma7.config.ts`; `DIRECT_URL` is used for migrations when configured, while the runtime adapter uses `DATABASE_URL`.
6. Create the first administrator with `pnpm admin:bootstrap` after setting `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a unique strong `BOOTSTRAP_ADMIN_PASSWORD` in the local environment.
7. Remove the bootstrap password from environment configuration after the administrator is created.
8. Run `pnpm dev`. The public website is expected at `http://localhost:3000` and GOS at `http://localhost:3001`.

## Useful root scripts

- `pnpm dev` — run both applications through Turborepo.
- `pnpm build` — build all applications/packages that define a build task.
- `pnpm lint` — lint configured workspaces.
- `pnpm typecheck` — run TypeScript checks in configured workspaces.
- `pnpm test` — run unit tests in configured workspaces.
- `pnpm qa` — run Prisma generation, static syntax/version checks, unit tests, typecheck, lint, and builds in sequence.
- `pnpm test:e2e` — run Playwright public-route, mobile-navigation, and unauthenticated-access tests; install Chromium first with `pnpm exec playwright install chromium`.
- `pnpm production:check` — validate baseline environment configuration.
- `pnpm production:check:strict` — validate baseline environment configuration as production.
- `pnpm smoke` — check configured app health endpoints.

## Deployment notes

Deploy `apps/web` and `apps/gos` as separate Vercel projects if desired. Set only the environment variables each app needs. `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, and the shared lead-intake secret must be configured server-side only. Do not expose them through `NEXT_PUBLIC_*` variables.

Apply reviewed migrations with `pnpm db:deploy` from the configured deployment environment. Never run destructive database reset commands against production. Test backup restoration and the public lead-to-CRM flow before opening the site to visitors.

## Verification status

Local verification on 19 October 2026:

- `pnpm db:generate`, `pnpm build`, `pnpm typecheck`, and `pnpm test` passed.
- `pnpm lint` passed with 0 errors and 16 existing warnings.
- `pnpm qa:static` passed; 152 TS/TSX files were scanned with 0 syntax errors.
- `pnpm production:check` passed with the root `.env` loaded automatically. Email and WhatsApp providers are still optional and unconfigured.
- `pnpm test:e2e` passed 7 tests, skipped 1, and failed 2 anonymous CRM API checks because Playwright reused the already-running GOS server, whose log reports that `DATABASE_URL` is missing. Restart that local server with the root environment loaded, then rerun the browser suite.

Database migrations, production credentials, provider delivery, and deployment have not been verified. Passing local checks is not production certification; complete the deployment checklist before launch.
