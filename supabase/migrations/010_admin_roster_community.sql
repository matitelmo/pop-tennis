-- Admin: scope roster to communities + public community slug lookup for middleware

ALTER TABLE roster_players
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id) ON DELETE CASCADE;

UPDATE roster_players
SET community_id = (SELECT id FROM communities WHERE slug = 'wild-on')
WHERE community_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_players_community_name
  ON roster_players (community_id, lower(display_name))
  WHERE community_id IS NOT NULL;

CREATE POLICY "communities_select_public" ON communities
  FOR SELECT USING (true);
