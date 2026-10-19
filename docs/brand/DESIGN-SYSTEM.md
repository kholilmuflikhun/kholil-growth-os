# Kholil Growth — Shared Design System v1.2 — Blue Palette

## Scope
Design tokens and reusable UI primitives are shared by `apps/web` (public brand website) and `apps/gos` (private operating workspace). The applications remain separate deployments and separate experiences.

## Fixed palette
- Brand blue: `#2563EB`
- Hover blue: `#1D4ED8`
- White: `#FFFFFF`
- Black / ink: `#111827`
- Light gray surface: `#F3F4F6`
- Gray border: `#D1D5DB`

- Secondary gray text: `#6B7280`

## Typography and components
- Existing Plus Jakarta Sans app font configuration is retained.
- Use clear hierarchy, concise copy, and accessible contrast.
- Shared primitives live in `packages/ui/src/index.tsx`.
- Shared Tailwind color tokens and CSS variables live in `packages/ui/src/theme.css`.
- Prefer Lucide icons, 12px control radius, 16px card radius, thin borders, and generous whitespace.
- Light mode is the default visual direction; dark mode retains the same brand-blue accent.
- Focus-visible controls use a visible blue focus ring.

## Product distinction
- Public website: service discovery, portfolio, trust, lead generation, and conversion.
- Private Growth OS: daily operations, CRM, finance, content, KPI, and business decisions.
- Keep separate app routes/domains and protect Growth OS with authentication; never expose secrets in client-side variables.

## Copy consistency
Use the canonical positioning “Creative Design • Digital Solutions • AI-Powered Business” and tagline “Dari Ide Menjadi Identitas, Produk, dan Solusi Digital.” Refer to `VOICE-KIT.md` (Brand Voice & Marketing Playbook v2.0) for writing rules, Marketing 5.0 principles, customer journey, CTA, and claim standards.
