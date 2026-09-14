import type { CommunityLocale } from "@/lib/community/locale";

export function formatDateLocalized(dateStr: string, locale: CommunityLocale): string {
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTimeLocalized(
  dateStr: string,
  locale: CommunityLocale
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "en" ? "now" : "ahora";
  if (mins < 60) return locale === "en" ? `${mins}m ago` : `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "en" ? `${hours}h ago` : `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "en" ? `${days}d ago` : `hace ${days}d`;
  return formatDateLocalized(dateStr, locale);
}

export function formatActivityMatchSummary(
  locale: CommunityLocale,
  winner: string,
  loser: string,
  scores: string
): string {
  return locale === "en"
    ? `${winner} beat ${loser} (${scores})`
    : `${winner} le ganó a ${loser} (${scores})`;
}

export function formatActivityBadgeSummary(
  locale: CommunityLocale,
  name: string,
  badgeLabel: string
): string {
  return locale === "en"
    ? `${name} unlocked ${badgeLabel}`
    : `${name} desbloqueó ${badgeLabel}`;
}
