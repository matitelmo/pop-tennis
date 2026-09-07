import { BookOpen, Plus, Swords, Trophy, User, type LucideIcon } from "lucide-react";
import { communityPath } from "@/lib/community/paths";

export type CommunityNavItem = {
  segment: string;
  label: string;
  icon: LucideIcon;
};

export const COMMUNITY_NAV_ITEMS: CommunityNavItem[] = [
  { segment: "ranking", label: "Ranking", icon: Trophy },
  { segment: "historial", label: "Historial", icon: Swords },
  { segment: "reglas", label: "Reglas", icon: BookOpen },
  { segment: "perfil", label: "Perfil", icon: User },
];

export const PARTIDO_NAV = {
  segment: "partido",
  label: "Partido",
  icon: Plus,
} as const;

export function getCommunityNavHref(slug: string, segment: string): string {
  return communityPath(slug, segment);
}

export function getPartidoHref(slug: string): string {
  return communityPath(slug, PARTIDO_NAV.segment);
}
