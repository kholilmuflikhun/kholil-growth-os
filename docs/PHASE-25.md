# Phase 25 — External Notification Delivery

## Scope
- Optional outbound email delivery through the Resend HTTP API.
- Optional WhatsApp message delivery through the WhatsApp Cloud API.
- Reminder automation sends external notifications best-effort after creating a new in-app notification.
- Authenticated owner/admin can send a test message from Settings.
- Missing provider configuration is reported as skipped; provider errors do not prevent in-app notifications from being created.

## Environment variables

```dotenv
# Email via Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL="Growth OS <notifications@your-verified-domain.example>"
NOTIFICATION_EMAIL_TO=

# WhatsApp Cloud API (Meta)
WHATSAPP_CLOUD_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TO=
```

Use a verified sender/domain for Resend and a valid WhatsApp Cloud API business number and recipient. WhatsApp recipient numbers should use international digits without `+`. Production messaging policies, user consent, templates, and Meta account requirements still apply. Never commit real credentials to source control.

## Test
1. Set the provider variables in local `.env` / Vercel environment variables.
2. Deploy/restart the GOS app.
3. Sign in as OWNER/ADMIN, open `/settings`, then click **Kirim notifikasi tes**.
4. Confirm delivery in the destination inbox/WhatsApp and provider dashboard.
5. Run the protected Phase 24 cron endpoint to test reminder delivery. The endpoint still requires `Authorization: Bearer <CRON_SECRET>`.

## Limitations
- Delivery is best-effort and does not yet persist per-channel delivery logs or retries.
- Email is sent as plain text via Resend; WhatsApp sends a text message via Graph API. Template-based outbound messages may be required by WhatsApp depending on conversation window/policy.
- No automatic marketing campaigns are sent; these are operational reminders only.
- Build, typecheck, provider credentials, and live delivery need verification in the target environment.
