-- Pop Tennis — Schema inicial

-- PERFILES / JUGADORES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  rating INTEGER NOT NULL,
  base_rating INTEGER NOT NULL,
  last_match_at TIMESTAMPTZ DEFAULT NOW(),
  last_decay_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTIDOS
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format TEXT NOT NULL CHECK (format IN ('1v1_bo3', '1v1_bo5', '2v2_bo3', '2v2_bo5')),
  set_scores JSONB NOT NULL,
  winner_ids UUID[] NOT NULL,
  loser_ids UUID[] NOT NULL,
  rating_changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTICIPANTES (extensión para H2H, streaks, badges)
CREATE TABLE match_participants (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  team TEXT NOT NULL CHECK (team IN ('winner', 'loser')),
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rating_delta INTEGER NOT NULL,
  PRIMARY KEY (match_id, user_id)
);

-- MEDALLAS / BADGES
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_code)
);

-- Índices
CREATE INDEX idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX idx_profiles_last_match ON profiles(last_match_at);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles: lectura para autenticados, update propio
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Matches: lectura e insert para autenticados
CREATE POLICY "matches_select_authenticated" ON matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "matches_insert_authenticated" ON matches
  FOR INSERT TO authenticated WITH CHECK (true);

-- Match participants
CREATE POLICY "match_participants_select_authenticated" ON match_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "match_participants_insert_authenticated" ON match_participants
  FOR INSERT TO authenticated WITH CHECK (true);

-- Badges: lectura pública autenticada, insert autenticado
CREATE POLICY "user_badges_select_authenticated" ON user_badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_badges_insert_authenticated" ON user_badges
  FOR INSERT TO authenticated WITH CHECK (true);

-- Storage: bucket avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
