-- Roster identities + notification fields

CREATE TABLE roster_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL UNIQUE,
  suggested_skill_level TEXT NOT NULL CHECK (
    suggested_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')
  ),
  suggested_rating INTEGER NOT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_roster_players_name_lower ON roster_players (lower(display_name));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roster_player_id UUID REFERENCES roster_players(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_rank INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_full_name_lower ON profiles (lower(full_name));

ALTER TABLE roster_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roster_select_authenticated" ON roster_players
  FOR SELECT TO authenticated USING (true);

-- Preset roster (Wild On group)
INSERT INTO roster_players (display_name, suggested_skill_level, suggested_rating, is_preset) VALUES
  ('Mati Telmo', 'advanced', 1600, true),
  ('Andy', 'expert', 2000, true),
  ('Charlie', 'advanced', 1600, true),
  ('Eli', 'advanced', 1600, true),
  ('Fran', 'expert', 2000, true),
  ('Lucas', 'intermediate', 1200, true),
  ('Marian', 'beginner', 800, true),
  ('Mata', 'advanced', 1600, true),
  ('Mati Viel', 'intermediate', 1200, true),
  ('Mica', 'beginner', 800, true),
  ('Papi', 'beginner', 800, true),
  ('Pilo', 'expert', 2000, true),
  ('Rama', 'beginner', 800, true),
  ('Tomi Laporta', 'intermediate', 1200, true);

-- Backfill: link existing profiles to roster by name match
UPDATE roster_players rp
SET claimed_by = p.id,
    claimed_at = COALESCE(p.created_at, NOW())
FROM profiles p
WHERE lower(rp.display_name) = lower(p.full_name)
  AND rp.claimed_by IS NULL;

UPDATE profiles p
SET roster_player_id = rp.id
FROM roster_players rp
WHERE rp.claimed_by = p.id
  AND p.roster_player_id IS NULL;

-- Migrate legacy badge codes to new ones
UPDATE user_badges SET badge_code = 'zapatero' WHERE badge_code IN ('inviolable', 'paseo_en_coche');
UPDATE user_badges SET badge_code = 'papa_de_la_banda' WHERE badge_code = 'papa_del_grupo';
UPDATE user_badges SET badge_code = 'viernes_flex' WHERE badge_code = 'lomo_de_metal';
