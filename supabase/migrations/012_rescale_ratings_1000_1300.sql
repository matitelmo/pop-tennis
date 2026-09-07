-- Rescale skill level starting ratings: 1000 / 1100 / 1200 / 1300
-- Preserves match deltas; shifts absolute rating_before/after in history.

UPDATE profiles
SET
  base_rating = CASE skill_level
    WHEN 'beginner' THEN 1000
    WHEN 'intermediate' THEN 1100
    WHEN 'advanced' THEN 1200
    WHEN 'expert' THEN 1300
  END,
  rating = rating + CASE skill_level
    WHEN 'beginner' THEN 200
    WHEN 'intermediate' THEN 100
    WHEN 'advanced' THEN 0
    WHEN 'expert' THEN -100
  END;

UPDATE community_members cm
SET
  base_rating = CASE p.skill_level
    WHEN 'beginner' THEN 1000
    WHEN 'intermediate' THEN 1100
    WHEN 'advanced' THEN 1200
    WHEN 'expert' THEN 1300
  END,
  rating = cm.rating + CASE p.skill_level
    WHEN 'beginner' THEN 200
    WHEN 'intermediate' THEN 100
    WHEN 'advanced' THEN 0
    WHEN 'expert' THEN -100
  END
FROM profiles p
WHERE cm.user_id = p.id;

UPDATE roster_players
SET suggested_rating = suggested_rating + CASE suggested_skill_level
  WHEN 'beginner' THEN 200
  WHEN 'intermediate' THEN 100
  WHEN 'advanced' THEN 0
  WHEN 'expert' THEN -100
END;

UPDATE match_participants mp
SET
  rating_before = mp.rating_before + CASE p.skill_level
    WHEN 'beginner' THEN 200
    WHEN 'intermediate' THEN 100
    WHEN 'advanced' THEN 0
    WHEN 'expert' THEN -100
  END,
  rating_after = mp.rating_after + CASE p.skill_level
    WHEN 'beginner' THEN 200
    WHEN 'intermediate' THEN 100
    WHEN 'advanced' THEN 0
    WHEN 'expert' THEN -100
  END
FROM profiles p
WHERE mp.user_id = p.id;
