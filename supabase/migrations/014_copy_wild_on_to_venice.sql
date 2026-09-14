-- Copy Wild On roster, ratings, and match history into Venice Beach.
-- Venice hides Wild On–specific trophy badges via show_badges: false.

DO $$
DECLARE
  wild_id UUID;
  venice_id UUID;
  rec RECORD;
  new_match_id UUID;
  venice_match_count INTEGER;
BEGIN
  SELECT id INTO wild_id FROM communities WHERE slug = 'wild-on';
  SELECT id INTO venice_id FROM communities WHERE slug = 'venice-beach';

  IF wild_id IS NULL OR venice_id IS NULL THEN
    RAISE EXCEPTION 'wild-on or venice-beach community not found';
  END IF;

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
    last_seen_at,
    joined_at
  )
  SELECT
    venice_id,
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
    last_seen_at,
    joined_at
  FROM community_members
  WHERE community_id = wild_id
  ON CONFLICT (community_id, user_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    base_rating = EXCLUDED.base_rating,
    availability = EXCLUDED.availability,
    last_match_at = EXCLUDED.last_match_at,
    last_decay_at = EXCLUDED.last_decay_at;

  SELECT COUNT(*)::INTEGER INTO venice_match_count
  FROM matches
  WHERE community_id = venice_id;

  IF venice_match_count = 0 THEN
    FOR rec IN
      SELECT * FROM matches WHERE community_id = wild_id
    LOOP
      new_match_id := gen_random_uuid();

      INSERT INTO matches (
        id,
        format,
        set_scores,
        winner_ids,
        loser_ids,
        rating_changes,
        created_at,
        status,
        submitted_by,
        confirmed_by,
        confirmation_deadline,
        team1_ids,
        team2_ids,
        winning_team,
        counter_set_scores,
        counter_winning_team,
        counter_submitted_by,
        is_weekly_match,
        community_id
      ) VALUES (
        new_match_id,
        rec.format,
        rec.set_scores,
        rec.winner_ids,
        rec.loser_ids,
        rec.rating_changes,
        rec.created_at,
        rec.status,
        rec.submitted_by,
        rec.confirmed_by,
        rec.confirmation_deadline,
        rec.team1_ids,
        rec.team2_ids,
        rec.winning_team,
        rec.counter_set_scores,
        rec.counter_winning_team,
        rec.counter_submitted_by,
        rec.is_weekly_match,
        venice_id
      );

      INSERT INTO match_participants (
        match_id,
        user_id,
        team,
        rating_before,
        rating_after,
        rating_delta
      )
      SELECT
        new_match_id,
        user_id,
        team,
        rating_before,
        rating_after,
        rating_delta
      FROM match_participants
      WHERE match_id = rec.id;
    END LOOP;
  END IF;

  UPDATE communities
  SET settings = settings || '{"show_badges": false}'::jsonb
  WHERE id = venice_id;
END $$;
