-- Confirmación de partidos con ventana de 24h

ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('pending', 'counter_proposed', 'confirmed'));

ALTER TABLE matches ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES profiles(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_ids UUID[];
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_ids UUID[];
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winning_team SMALLINT CHECK (winning_team IN (1, 2));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS counter_set_scores JSONB;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS counter_winning_team SMALLINT CHECK (counter_winning_team IN (1, 2));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS counter_submitted_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_matches_status_deadline
  ON matches (status, confirmation_deadline)
  WHERE status IN ('pending', 'counter_proposed');
