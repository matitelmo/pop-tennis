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

1. Use the existing Supabase project (migrations through `010_admin_roster_community.sql`).
2. Copy `.env.example` to `.env.local` and fill in values.
3. Stripe webhook → `/api/stripe/webhook` (Venice subscriptions).
4. Resend for transactional email (Venice match confirm).

### Admin console

Set `ADMIN_USER_ID` to the Supabase Auth UUID for your admin account (e.g. `matitelmo@hotmail.com` — find the UUID in Supabase Dashboard → Authentication → Users). Set `ADMIN_EMAIL` to the same email for dispute notifications.

Then visit `/admin` while logged in as that user. The console includes:

- Community settings editor and create-community wizard
- Member management (add users, comp subscriptions, edit ratings)
- Match list with force-confirm and delete
- Roster preset CRUD (for roster-mode communities like Wild On)
- Dispute resolution

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
