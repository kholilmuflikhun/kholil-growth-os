# Phase 24 — Automated Notification & Reminder Engine

## Added
- Scheduled automation dispatches notifications for open reminders due within the next 24 hours.
- Separate overdue notifications are created once an open reminder has passed its due time.
- Unique `dedupeKey` values prevent duplicate notifications across repeated or overlapping cron executions.
- Notification events are scoped to the first OWNER/ADMIN account, matching the existing single-owner reminder model.
- The existing Vercel Cron schedule invokes `/api/automation/dispatch` daily at 02:00 UTC (09:00 WIB).

## Setup
1. Apply the new database migration: `pnpm db:migrate`.
2. Set `CRON_SECRET` as a strong random secret in local/deployment environment variables.
3. Confirm `apps/gos/vercel.json` has the cron path `/api/automation/dispatch`.
4. Deploy the GOS app. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
5. Open `/notifications` after login to view and mark notifications read.

## Manual smoke check
Call the endpoint with a bearer token matching `CRON_SECRET`. Without a valid secret it should return HTTP 401. A successful response includes counts for upcoming/overdue reminders and created notifications.

## Limitations
- Delivery is in-app only. This phase does not send WhatsApp, email, SMS, or native push notifications.
- The schedule is daily, so a reminder created after the daily run may be notified on the next run; it is not minute-by-minute monitoring.
- Notifications are generated for the first OWNER/ADMIN user, consistent with the existing owner-level reminder workflow.
- Build, typecheck, and live database migration have not been run in this packaging environment.
