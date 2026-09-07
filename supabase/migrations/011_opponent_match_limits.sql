-- Per-community opponent match limits

UPDATE communities
SET settings = settings || '{"opponent_match_limit": 0, "opponent_match_window_days": 30}'::jsonb
WHERE slug = 'wild-on';

UPDATE communities
SET settings = settings || '{"opponent_match_limit": 2, "opponent_match_window_days": 30}'::jsonb
WHERE slug = 'venice-beach';
