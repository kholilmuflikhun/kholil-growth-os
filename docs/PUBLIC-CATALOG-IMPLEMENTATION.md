# Public Service Catalog Implementation

## What was added

- Six service categories with searchable/filterable service cards.
- Structured service data in `apps/web/src/lib/catalog.ts`.
- Individual static service detail routes at `/layanan/[slug]` with scope, intended customers, deliverables, indicative price, timeline, and consultation CTA.
- Five package cards (Brand Starter, Social Media Starter, Business Starter, Business Digital, Print & Merchandise).
- A portfolio section containing explicitly labeled **demonstration concepts**, not claims of completed client work. Replace/add real work samples before making client-case claims.
- Contact form service options generated from the same service catalog and query-parameter preselection for service/package CTAs.
- Public form submission remains server-to-server through `apps/web/src/app/api/contact/route.ts` to the private Growth OS `/api/leads` endpoint.
- Shared-secret verification for public lead intake in production. The secret is server-only and must never use a `NEXT_PUBLIC_` prefix.

## Suggested separate Vercel projects

Use two independent Vercel projects and domains (examples only; these domains are not claimed to be registered):

1. Public site: `kholilmuflikhun.com`, Root Directory `apps/web`.
2. Private Growth OS: `os.kholilmuflikhun.com`, Root Directory `apps/gos`.

Keep the monorepo connected to both projects. Set the same PostgreSQL `DATABASE_URL` and required database/auth environment variables for GOS only, as applicable. Do not make the private dashboard public by linking it into the public site's navigation; use a separate domain and its own authentication.

## Environment variables

### Public web Vercel project (`apps/web`)

- `NEXT_PUBLIC_SITE_URL=https://<public-domain>`
- `NEXT_PUBLIC_GOS_URL=https://<gos-domain>` (for client-side links only if needed)
- `GOS_API_URL=https://<gos-domain>` (server-side API proxy)
- `GOS_LEAD_API_SECRET=<same strong random secret as PUBLIC_LEAD_API_SECRET on GOS>`

### Private GOS Vercel project (`apps/gos`)

- `PUBLIC_LEAD_API_SECRET=<same strong random secret as GOS_LEAD_API_SECRET on web>`
- `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, and other required GOS secrets.
- Do not add `GOS_LEAD_API_SECRET` or `PUBLIC_LEAD_API_SECRET` to client-side code or expose them with `NEXT_PUBLIC_`.

Generate the shared secret with a cryptographically secure generator, for example `openssl rand -hex 32`. Configure it in the Vercel Environment Variables UI for both projects. Never commit actual secret values to Git.

## Lead intake flow

1. Visitor chooses a service/package; its name is preselected in the quote form when they click a CTA.
2. The public browser submits to the public app's `/api/contact` route.
3. The public server validates the lead and forwards the request to GOS with the shared secret.
4. GOS verifies the shared secret and creates a Lead record with source `public-website`.
5. The owner signs in to the private GOS domain and manages the lead in CRM.

If the shared secret is not configured in production, GOS rejects public lead intake rather than accepting unverified submissions. The WhatsApp contact link remains available as an alternate contact channel.

## Prices and portfolio

The catalog's numeric prices are indicative starting points. Confirm the actual pricing, package scope, revision limits, production costs, license terms, and timelines before public launch. The sample portfolio cards are demonstration concepts; replace them with actual work, approved client images, or case studies before claiming they represent completed projects.

## Validation checklist

- [ ] Install dependencies and generate `pnpm-lock.yaml` with the intended pnpm version.
- [ ] Run `pnpm db:generate` and `pnpm qa` from the monorepo root.
- [ ] Configure the same lead-intake secret on both Vercel projects.
- [ ] Apply database migrations to the production database before using CRM.
- [ ] Test form success, invalid input, unavailable GOS API, and wrong/missing secret.
- [ ] Verify service detail pages, filters, mobile layout, theme toggle, and query preselection.
- [ ] Replace concept portfolio cards with real approved work when available.
- [ ] Run smoke tests on both deployed domains.
