-- Weekly match pairings + bonus flag on matches

CREATE TABLE weekly_match_pairings (
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (week_start, user_id),
  CHECK (user_id <> opponent_id)
);

CREATE INDEX idx_weekly_pairings_opponent ON weekly_match_pairings (week_start, opponent_id);
CREATE INDEX idx_weekly_pairings_week ON weekly_match_pairings (week_start DESC);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_weekly_match BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE weekly_match_pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_pairings_select_authenticated" ON weekly_match_pairings
  FOR SELECT TO authenticated USING (true);
