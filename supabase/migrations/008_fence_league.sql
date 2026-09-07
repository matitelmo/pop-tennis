-- Fence: Venice Pop Tennis League

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'comped'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability JSONB;

ALTER TABLE profiles ALTER COLUMN roster_player_id DROP NOT NULL;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'counter_proposed', 'disputed', 'confirmed'));

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_challenges_to_user ON challenges(to_user_id, created_at DESC);
