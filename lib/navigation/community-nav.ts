import type { CommunityLocale } from "@/lib/community/locale";
import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarSearch, Plus, Swords, Trophy, User } from "lucide-react";
import { communityPath } from "@/lib/community/paths";
import { t } from "@/lib/i18n/messages";

export type CommunityNavItem = {
  segment: string;
  label: string;
  icon: LucideIcon;
};

export function getCommunityNavItems(
  locale: CommunityLocale,
  options?: { showFindPlayers?: boolean }
): CommunityNavItem[] {
  const items: CommunityNavItem[] = [
    { segment: "ranking", label: t(locale, "navRanking"), icon: Trophy },
    { segment: "historial", label: t(locale, "navHistory"), icon: Swords },
  ];

  if (options?.showFindPlayers) {
    items.push({
      segment: "find-players",
      label: t(locale, "navFindPlayers"),
      icon: CalendarSearch,
    });
  }

  items.push(
    { segment: "reglas", label: t(locale, "navRules"), icon: BookOpen },
    { segment: "perfil", label: t(locale, "navProfile"), icon: User }
  );

  return items;
}

export function getPartidoNav(locale: CommunityLocale) {
  return {
    segment: "partido",
    label: t(locale, "navMatch"),
    icon: Plus,
  } as const;
}

export function getCommunityNavHref(slug: string, segment: string): string {
  return communityPath(slug, segment);
}

export function getPartidoHref(slug: string): string {
  return communityPath(slug, "partido");
}

/** @deprecated Use getCommunityNavItems(locale) */
export const COMMUNITY_NAV_ITEMS = getCommunityNavItems("es");

/** @deprecated Use getPartidoNav(locale) */
export const PARTIDO_NAV = getPartidoNav("es");
