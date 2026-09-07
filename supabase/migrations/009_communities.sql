-- Multi-community platform

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  base_rating INTEGER NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'comped')),
  stripe_customer_id TEXT,
  weekly_opt_in BOOLEAN NOT NULL DEFAULT false,
  availability JSONB,
  last_match_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_decay_at TIMESTAMPTZ,
  last_seen_rank INTEGER,
  last_seen_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX idx_community_members_user ON community_members(user_id);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

-- Seed communities
INSERT INTO communities (slug, name, settings) VALUES
(
  'wild-on',
  'Wild On Pop Tennis',
  '{
    "match_confirmation": "instant",
    "confirmation_hours": 24,
    "requires_subscription": false,
    "leaderboard_gender_split": false,
    "leaderboard_quarterly_view": false,
    "weekly_rival_mode": "auto",
    "signup_mode": "roster",
    "allowed_formats": ["1v1_bo1", "1v1_bo3", "1v1_bo5", "2v2_bo1", "2v2_bo3", "2v2_bo5"]
  }'::jsonb
),
(
  'venice-beach',
  'Venice Pop Tennis League',
  '{
    "match_confirmation": "pending",
    "confirmation_hours": 24,
    "requires_subscription": true,
    "leaderboard_gender_split": true,
    "leaderboard_quarterly_view": true,
    "weekly_rival_mode": "opt_in",
    "signup_mode": "open",
    "allowed_formats": ["1v1_bo3", "1v1_bo5", "2v2_bo3", "2v2_bo5"]
  }'::jsonb
);

-- Backfill Wild On memberships from existing profiles
INSERT INTO community_members (
  community_id,
  user_id,
  rating,
  base_rating,
  subscription_status,
  stripe_customer_id,
  weekly_opt_in,
  availability,
  last_match_at,
  last_decay_at,
  last_seen_rank,
  last_seen_at
)
SELECT
  (SELECT id FROM communities WHERE slug = 'wild-on'),
  p.id,
  p.rating,
  p.base_rating,
  COALESCE(p.subscription_status, 'none'),
  p.stripe_customer_id,
  COALESCE(p.weekly_opt_in, false),
  p.availability,
  p.last_match_at,
  p.last_decay_at,
  p.last_seen_rank,
  p.last_seen_at
FROM profiles p;

-- Backfill matches to Wild On
UPDATE matches
SET community_id = (SELECT id FROM communities WHERE slug = 'wild-on')
WHERE community_id IS NULL;

-- Weekly pairings: add community_id column and backfill
ALTER TABLE weekly_match_pairings ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

UPDATE weekly_match_pairings
SET community_id = (SELECT id FROM communities WHERE slug = 'wild-on')
WHERE community_id IS NULL;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_select_authenticated" ON communities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_members_select_authenticated" ON community_members
  FOR SELECT TO authenticated USING (true);
