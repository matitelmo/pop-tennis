export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type MatchFormat = "1v1_bo3" | "1v1_bo5" | "2v2_bo3" | "2v2_bo5";

export type SetScore = { p1: number; p2: number };

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  skill_level: SkillLevel;
  rating: number;
  base_rating: number;
  last_match_at: string;
  last_decay_at: string | null;
  created_at: string;
  roster_player_id: string | null;
  last_seen_rank: number | null;
  last_seen_at: string | null;
};

export type RosterPlayer = {
  id: string;
  display_name: string;
  suggested_skill_level: SkillLevel;
  suggested_rating: number;
  is_preset: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
};

export type MatchStatus = "pending" | "counter_proposed" | "confirmed";

export type Match = {
  id: string;
  format: MatchFormat;
  set_scores: SetScore[];
  winner_ids: string[];
  loser_ids: string[];
  rating_changes: Record<string, number> | null;
  created_at: string;
  status: MatchStatus;
  submitted_by: string | null;
  confirmed_by: string | null;
  confirmation_deadline: string | null;
  team1_ids: string[] | null;
  team2_ids: string[] | null;
  winning_team: 1 | 2 | null;
  counter_set_scores: SetScore[] | null;
  counter_winning_team: 1 | 2 | null;
  counter_submitted_by: string | null;
  is_weekly_match: boolean;
};

export type WeeklyMatchPairing = {
  week_start: string;
  user_id: string;
  opponent_id: string;
  created_at: string;
};

export type MatchParticipant = {
  match_id: string;
  user_id: string;
  team: "winner" | "loser";
  rating_before: number;
  rating_after: number;
  rating_delta: number;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_code: string;
  unlocked_at: string;
};

export type BadgeCode =
  | "el_yacare"
  | "zapatero"
  | "sello_fantasma"
  | "caza_gigantes"
  | "papa_de_la_banda"
  | "viernes_flex";

export type RatingHistoryPoint = {
  date: string;
  rating: number;
};
