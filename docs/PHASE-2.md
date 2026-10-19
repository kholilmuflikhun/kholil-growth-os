# Phase 2: Authentication and Lead Intake

Implemented in this starter increment:
- Signed, HTTP-only session cookie using `jose`.
- Login/logout endpoints.
- Middleware gate for private GOS routes.
- Password-change endpoint with strength checks.
- One-time administrator bootstrap script; refuses to overwrite an existing account.
- Public lead intake endpoint with Zod validation.
- Authenticated lead listing endpoint.
- Prisma singleton.

## Configure
1. Set `DATABASE_URL` and a random `AUTH_SECRET` (at least 32 characters).
2. Install dependencies and generate Prisma client.
3. Apply database migrations.
4. Set `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a unique strong `BOOTSTRAP_ADMIN_PASSWORD` in a local, uncommitted `.env`.
5. Run `pnpm admin:bootstrap` once.
6. Remove the bootstrap password from the environment after account creation.
7. Start the GOS app and log in at `/login`.

## Important production hardening
- Configure rate limiting at the edge/WAF for login and public lead endpoints.
- Add CSRF/origin checks for state-changing routes according to deployment topology.
- Review proxy trust and logging policies.
- Implement email-based recovery, session revocation, audit trails, and role-based authorization before multi-user deployment.
- Keep demo metrics visibly labeled; the dashboard summary is not yet driven by persisted transactions.
- The public lead endpoint is in the GOS app; route the public contact form to `NEXT_PUBLIC_GOS_URL` or move this endpoint into a shared backend app when deploying cross-origin.
