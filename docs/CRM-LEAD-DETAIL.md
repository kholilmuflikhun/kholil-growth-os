# CRM Lead Detail — Kholil Growth OS

## Delivered
- Pipeline stages use the `LeadStatus` enum: NEW, CONTACTED, QUALIFIED, DISCOVERY, PROPOSAL, NEGOTIATION, WON, LOST.
- Lead value and win probability are stored separately; weighted pipeline is estimated value multiplied by probability.
- Lead detail supports owner, next follow-up, notes, and a loss reason when the stage is LOST.
- `LeadActivity` stores dated interactions and scheduled follow-ups, including the staff username that created the activity.
- Status, estimated value, probability, and follow-up changes create a CRM activity entry.
- Authenticated CRM staff can create leads manually; public intake remains server-to-server and protected by `PUBLIC_LEAD_API_SECRET` in production.
- `GET /api/leads` includes recent activity history for each lead.
- `GET/POST /api/leads/:id/activities` reads and creates activity history. Both operations require an OWNER, ADMIN, or MANAGER session.

## Default win probabilities
| Stage | Probability |
|---|---:|
| NEW | 10% |
| CONTACTED | 25% |
| QUALIFIED | 50% |
| DISCOVERY | 50% |
| PROPOSAL | 70% |
| NEGOTIATION | 85% |
| WON | 100% |
| LOST | 0% |

These are starting assumptions and should be calibrated using historical conversion data. Weighted pipeline is not cash received or booked revenue.

## Database migration
Apply `prisma/migrations/202610170001_crm_lead_detail/migration.sql` using the existing migration deployment process. Then regenerate Prisma Client with `pnpm db:generate`.

## Production verification checklist
1. Apply migrations in staging and production after backup/approval.
2. Run `pnpm db:generate` and `pnpm qa`.
3. Verify anonymous requests cannot list, update, delete, or add CRM activities.
4. Verify public website lead intake only works with the server-to-server shared secret.
5. Verify manual lead creation, stage change, forecast calculation, follow-up date, and activity history.
6. Verify won leads are linked to project/customer/invoice by the subsequent sales workflow; this CRM change does not auto-create invoices.
7. Configure and test reminder delivery for `nextFollowUp` as a separate notification workflow.
