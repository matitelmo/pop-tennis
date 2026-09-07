# Pop Tennis — Multi-Community Platform

One app, one Supabase, one Vercel deploy — multiple pop tennis communities with separate rankings and settings.

## Communities

| Community | URL | Signup | Matches | Subscription |
|-----------|-----|--------|---------|--------------|
| **Wild On** | `/wild-on/ranking` | Roster reclaim | Instant confirm | Free |
| **Venice Beach** | `/venice-beach/ranking` | Open signup | 24h pending confirm | $10/mo |

Same account can join both; ratings and subscriptions are **per community**.

## Features

- Community-scoped Elo rankings, match history, weekly rivals
- Configurable per community: confirmation mode, paywall, gender/quarterly boards, signup flow
- Wild On: roster registration, instant points, auto weekly rival
- Venice: Stripe subscriptions, match confirmation, gender split, quarterly view, opt-in weekly rival

## Setup

1. Use the existing Supabase project (migrations through `009_communities.sql`).
2. Copy `.env.example` to `.env.local` and fill in values.
3. Stripe webhook → `/api/stripe/webhook` (Venice subscriptions).
4. Resend for transactional email (Venice match confirm).

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run comp-seed` | Mark beta users as comped |
| `npm run recalculate-ratings` | Replay all matches from base ratings |
| `npm run confirm-pending-matches` | Bulk-confirm pending matches |

## Deploy

- **GitHub:** [matitelmo/pop-tennis](https://github.com/matitelmo/pop-tennis)
- **Vercel:** Single project
- Venice QR landing: `/join/venice-beach`

Legacy paths (`/ranking`, `/partido`, etc.) redirect to your last community or Wild On.
