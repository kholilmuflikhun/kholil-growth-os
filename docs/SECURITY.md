# Security Guide

## Authentication

- Admin bootstrap is a one-time terminal command (`pnpm admin:bootstrap`) and refuses to overwrite an existing account.
- Passwords are hashed with bcrypt; the bootstrap requires a unique strong password.
- Sessions are signed JWTs with issuer/audience/JTI, tracked in PostgreSQL, expire after eight hours, and can be revoked at logout/password change.
- The session cookie is HttpOnly, SameSite=Lax, path-scoped, and Secure in production.
- A user whose `mustChangePassword` is true is redirected to account settings and ordinary APIs reject the session until the password changes.
- Public registration is not implemented.

## Rate limiting and public intake

- Login attempts and public lead submissions use PostgreSQL fixed-window buckets. Only a hash of the network identifier is stored.
- Lead intake from the public app requires the server-side shared secret in production. The public app passes the client address only after adding the shared secret; direct clients cannot set the secret.
- Configure provider/WAF rate limits as an additional control. Forwarded IP headers must be overwritten by the trusted hosting proxy; do not trust client-supplied forwarding headers from arbitrary origins.
- Request bodies have explicit size limits and are validated server-side.
- Public lead consent timestamp/version are recorded; minimize the data stored in lead records.

## Finance and integrity

- Payment creation locks the target order row, uses a database transaction, enforces remaining balance, and requires an idempotency key.
- Order conversion is transactional and idempotent on the proposal relation.
- Payment rows and the corresponding cash-flow transaction are created together.
- Financial transaction classification separates customer payments from other income, direct costs, operating expenses, owner withdrawals, tax, loan principal, asset purchases, refunds, and unclassified legacy records.
- `UNCLASSIFIED` transactions are included in cash-flow totals but excluded from profit metrics until reviewed and classified.

## HTTP headers

Both Next.js applications set CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and related headers. HSTS is enabled in production. Validate CSP in browser-based tests before deploying additional analytics, embeds, or third-party scripts.

## Remaining controls to configure

- Provider/WAF rate limiting and monitoring.
- Secret rotation process and production secret manager.
- Backup retention and tested restore procedure.
- Production error monitoring.
- Storage access controls before adding uploads/downloads.
- Payment-provider signature verification before enabling checkout/webhooks.

This guide describes code-level controls and does not replace a security assessment or successful production test run.
