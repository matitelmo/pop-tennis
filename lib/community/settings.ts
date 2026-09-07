import type { MatchFormat } from "@/types/database";

export type MatchConfirmationMode = "instant" | "pending";
export type WeeklyRivalMode = "auto" | "opt_in" | "off";
export type SignupMode = "roster" | "open";

export type CommunitySettings = {
  match_confirmation: MatchConfirmationMode;
  confirmation_hours: number;
  requires_subscription: boolean;
  leaderboard_gender_split: boolean;
  leaderboard_quarterly_view: boolean;
  weekly_rival_mode: WeeklyRivalMode;
  signup_mode: SignupMode;
  allowed_formats: MatchFormat[];
};

export const DEFAULT_COMMUNITY_SETTINGS: CommunitySettings = {
  match_confirmation: "instant",
  confirmation_hours: 24,
  requires_subscription: false,
  leaderboard_gender_split: false,
  leaderboard_quarterly_view: false,
  weekly_rival_mode: "auto",
  signup_mode: "open",
  allowed_formats: ["1v1_bo3", "1v1_bo5", "2v2_bo3", "2v2_bo5"],
};

export function parseCommunitySettings(raw: unknown): CommunitySettings {
  if (!raw || typeof raw !== "object") return DEFAULT_COMMUNITY_SETTINGS;
  const s = raw as Partial<CommunitySettings>;
  return {
    match_confirmation: s.match_confirmation === "pending" ? "pending" : "instant",
    confirmation_hours: s.confirmation_hours ?? 24,
    requires_subscription: Boolean(s.requires_subscription),
    leaderboard_gender_split: Boolean(s.leaderboard_gender_split),
    leaderboard_quarterly_view: Boolean(s.leaderboard_quarterly_view),
    weekly_rival_mode: s.weekly_rival_mode ?? "auto",
    signup_mode: s.signup_mode === "roster" ? "roster" : "open",
    allowed_formats: Array.isArray(s.allowed_formats)
      ? (s.allowed_formats as MatchFormat[])
      : DEFAULT_COMMUNITY_SETTINGS.allowed_formats,
  };
}

export function allowsFormat(settings: CommunitySettings, format: MatchFormat): boolean {
  return settings.allowed_formats.includes(format);
}
