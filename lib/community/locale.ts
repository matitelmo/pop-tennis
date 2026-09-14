export type CommunityLocale = "en" | "es";

const LOCALE_BY_SLUG: Record<string, CommunityLocale> = {
  "venice-beach": "en",
};

export function getCommunityLocale(communitySlug: string): CommunityLocale {
  return LOCALE_BY_SLUG[communitySlug] ?? "es";
}

export function isEnglishCommunity(communitySlug: string): boolean {
  return getCommunityLocale(communitySlug) === "en";
}
