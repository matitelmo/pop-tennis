# Fence — Venice Pop Tennis League

Paid league platform for open drop-in pop tennis at Venice Beach. Forked from the Wild On friend-group app; **Wild On** continues separately at [pop-tennis](https://github.com/matitelmo/pop-tennis).

## Features

- Open registration with real names and gender-split leaderboards
- Stripe subscriptions ($10/mo or $60/yr) — pay before logging your first match
- Match confirmation (24h auto-approve) with admin dispute resolution
- Weekly rival opt-in with win bonus
- Availability matching to find partners
- Quarterly “points gained” leaderboard view

## Setup

1. Create a **new** Supabase project (do not reuse Wild On credentials).
2. Run migrations in `supabase/migrations/` in order.
3. Copy `.env.example` to `.env.local` and fill in values.
4. Create Stripe products/prices and set webhook to `/api/stripe/webhook`.
5. Configure Resend for transactional email.

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run comp-seed` | Mark beta users as comped (edit emails in script) |
| `npm run recalculate-ratings` | Replay all matches from base ratings |
| `npm run confirm-pending-matches` | Bulk-confirm pending matches |

## Deploy

- **GitHub:** `matitelmo/fence` (separate repo from Wild On)
- **Vercel:** New project linked to `fence` repo
- **Crons:** `confirm-matches` (hourly), `decay` (daily), `match-reminders` (hourly)

## Environment

See [`.env.example`](.env.example) for all required variables.
