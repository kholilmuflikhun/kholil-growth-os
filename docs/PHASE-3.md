# Phase 3 — CRM, Finance, Dashboard

## Implemented
- CRM page `/leads`: database-backed lead list, search, create, pipeline status changes, estimated value, follow-up date, and delete.
- Finance page `/finance`: database-backed income/expense entry, month selector, monthly totals, and transaction table.
- Dashboard `/`: live aggregates from PostgreSQL for current-month income/expenses, active leads, projects, target progress, and recent leads.
- Settings `/settings`: account information and password-change form.
- Logout endpoint now clears the HTTP-only session cookie and redirects to `/login`.

## Financial definitions
- `INCOME` and `EXPENSE` amounts are stored as positive amounts; transaction type controls aggregation.
- Dashboard revenue means recorded income transactions for the current calendar month.
- Cash difference is recorded income minus recorded expenses. It is not a complete accounting profit figure and does not account for accruals, unpaid invoices, taxes, owner draws, or inventory.
- Pipeline estimates are not counted as received revenue.

## Setup / migration
The schema already includes `Lead`, `FinancialTransaction`, `Goal`, and `Project`; no new database migration is required for this phase.
After setting environment variables and installing dependencies:
1. `pnpm db:generate`
2. `pnpm db:migrate`
3. `pnpm db:seed`
4. `pnpm dev`

## Remaining production hardening
- Add CSRF/origin policy and rate limits to public lead intake.
- Add audit history for status and finance changes.
- Add pagination and CSV exports.
- Re-check user status/role from database per request; rotate sessions on password change.
- Configure database backups and monitoring.
- Run dependency install, lint, typecheck, build, and integration tests in an environment with package registry and PostgreSQL access.

## Public website lead intake
- The public contact form posts to the same-origin `apps/web` route `/api/contact`.
- Set `GOS_API_URL` to the deployed GOS origin (for local development `http://localhost:3001`).
- The web route validates the payload and forwards it server-to-server to GOS `/api/leads`.
- If the two apps are deployed separately, configure `GOS_API_URL` in the public web deployment. Ensure the GOS API is reachable from that server and add rate limiting/WAF before production.

- Middleware excludes `/api/leads` so public lead submissions can reach the route handler; `GET`, `PATCH`, and `DELETE` enforce their own session/role checks. Public `POST` needs rate limiting before production.
- Sidebar roadmap routes (`/goals`, `/projects`, `/content`, `/reports`) currently display a clearly labeled roadmap page, not implemented CRUD.

## Phase 4 additions
- Goals & Strategy now supports database-backed goal creation and status changes through `/api/goals`.
- CRM export: `/api/leads/export` (session-protected CSV).
- Finance export: `/api/finance/export?month=YYYY-MM` (session-protected monthly CSV).
- CSV exports escape quotes and prefix formula-leading cell values to reduce spreadsheet formula injection risk.

## Phase 5 additions
- Projects & Orders now supports create/list/status update/delete, project budget and deadline.
- Content Planner now supports create/list/status update/delete and scheduled/published dates.
- KPI & Reports now supports create/list/delete for KPI result records and a simple weighted score summary.
- Goals API uses `Goal.description`; migration `202610150001_phase5_operations` adds the nullable field. Projects also have a dedicated optional `customerName` field added by this migration.
- Apply migrations with `pnpm db:migrate` after installing dependencies and configuring PostgreSQL.

## Phase 6 — Project-to-finance integration
- Financial transactions can optionally reference a project using `projectId`.
- Finance entry form includes a project selector and transaction history shows the associated project.
- Project list summarizes linked income and expense transactions by project.
- Finance CSV exports include the project name.
- Migration `202610150002_project_finance_link` adds the nullable relation and index. Apply database migrations before use.
- Only transactions explicitly linked to a project contribute to project-level realized income/cost summaries.


## Phase 7 — Business Intelligence & Forecasting
- Added `/analytics`, a protected Business Intelligence page with six-month recorded income/expense trend, net cash flow, open CRM pipeline estimate, current-month activity, KPI score, and target pace projection.
- Added transparent heuristic recommendations for follow-up, finance review, and content execution.
- Forecast is a simple current-month run-rate extrapolation and is explicitly labeled as an estimate, not a guarantee.
- The overview dashboard no longer silently substitutes a hard-coded monthly revenue target when no active goal exists. Configure a goal in `/goals` to use target-progress calculations.
- Analytics reads existing PostgreSQL records; no new schema migration is required.


## Phase 8 — Reminders & Action Center
- Added protected `/reminders` page and CRUD API for action reminders with due date/time, notes, priority, and open/done state.
- Overdue and due-today indicators are computed from stored reminder dates when the page is loaded.
- Added `Reminder` database model and migration `202610160001_reminders`.
- Added Reminders & Actions to the private dashboard navigation.
- This phase provides in-app reminder management; it does not send push, WhatsApp, or email notifications yet. Those require an external provider and credentials.


## Phase 9 — Integrations & Notification Automation
- Added `Notification` records scoped to the authenticated user and a protected Notification Center at `/notifications`.
- Added `/api/automation/dispatch`, protected by `CRON_SECRET` as a Bearer token. It idempotently creates in-app notifications for open reminders that are due, without duplicate records for the same reminder.
- Added `apps/gos/vercel.json` with a daily Vercel Cron schedule at 02:00 UTC (09:00 WIB). Configure `CRON_SECRET` in the Vercel project environment. This assumes `apps/gos` is the Vercel project root.
- This phase provides in-app notifications only; WhatsApp/email/push delivery is not included. Vercel Cron availability depends on the deployed Vercel plan and project configuration.


## Phase 10 — Business Assistant & Workflow Recommendations
- Added authenticated `/assistant` and `/api/assistant` routes.
- Generates a daily business briefing from actual recorded transactions, active goal, open leads, overdue follow-ups, due reminders, and published content.
- Ranks rule-based recommendations, lists follow-ups due today/overdue, and shows active leads with the largest recorded estimated values.
- This is intentionally a transparent rule-based assistant; no external LLM API is called and no outbound messages are sent. It refreshes when opened or manually refreshed.


## Phase 11 — Revenue Growth Engine
- Added protected `/revenue` planning page and `/api/revenue` snapshot endpoint.
- Editable calculator turns daily revenue target, active days, average transaction value, and assumed conversion rate into estimated monthly target, required transactions, and required leads.
- Reads current-month recorded income/expenses, CRM pipeline and outcomes, active goal, and active service catalog.
- Defaults to the user's previously defined target of Rp200,000 per active day and 26 active days, but all calculator assumptions can be edited. If an active goal exists, its target/active-day value seeds the daily target on load.
- Scenarios are explicitly labeled as simulations; not profit forecasts, guaranteed income, or a replacement for actual records.
- No database schema migration is required for this phase.


## Phase 12 — Sales Pipeline & Proposal Management
- Added a Proposal data model linked to Lead and a migration at `202610160003_proposals`.
- Added protected `/proposals` UI and CRUD API for draft/sent/accepted/rejected/expired proposals, amount, validity date, notes, and associated prospect.
- Creating a proposal updates the lead to PROPOSAL and stores the proposal amount as its estimated value. Marking a proposal accepted moves an active lead to NEGOTIATION for a human to finalize the deal; the UI does not automatically mark it WON or create revenue.
- Proposal acceptance is not the same as cash received. Record actual receipts separately in Finance.
