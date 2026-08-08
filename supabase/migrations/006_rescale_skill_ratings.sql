-- Rescale skill level starting ratings: 800 / 1000 / 1200 / 1400
-- Preserves match deltas; shifts absolute rating_before/after in history.

UPDATE profiles
SET
  base_rating = CASE skill_level
    WHEN 'beginner' THEN 800
    WHEN 'intermediate' THEN 1000
    WHEN 'advanced' THEN 1200
    WHEN 'expert' THEN 1400
  END,
  rating = rating + CASE skill_level
    WHEN 'beginner' THEN 0
    WHEN 'intermediate' THEN -200
    WHEN 'advanced' THEN -400
    WHEN 'expert' THEN -400
  END;

UPDATE roster_players
SET suggested_rating = CASE suggested_skill_level
  WHEN 'beginner' THEN 800
  WHEN 'intermediate' THEN 1000
  WHEN 'advanced' THEN 1200
  WHEN 'expert' THEN 1400
END;

UPDATE match_participants mp
SET
  rating_before = mp.rating_before + CASE p.skill_level
    WHEN 'beginner' THEN 0
    WHEN 'intermediate' THEN -200
    WHEN 'advanced' THEN -400
    WHEN 'expert' THEN -400
  END,
  rating_after = mp.rating_after + CASE p.skill_level
    WHEN 'beginner' THEN 0
    WHEN 'intermediate' THEN -200
    WHEN 'advanced' THEN -400
    WHEN 'expert' THEN -400
  END
FROM profiles p
WHERE mp.user_id = p.id;
