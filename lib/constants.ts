import type { MatchFormat, SkillLevel } from "@/types/database";

export const K_FACTOR = 32;

export const SKILL_LEVELS: {
  value: SkillLevel;
  label: string;
  rating: number;
}[] = [
  { value: "beginner", label: "Principiante", rating: 800 },
  { value: "intermediate", label: "Intermedio", rating: 1200 },
  { value: "advanced", label: "Avanzado", rating: 1600 },
  { value: "expert", label: "Experto", rating: 2000 },
];

export const FORMAT_MULTIPLIERS: Record<MatchFormat, number> = {
  "1v1_bo5": 1.5,
  "1v1_bo3": 1.2,
  "2v2_bo5": 1.0,
  "2v2_bo3": 0.8,
};

export const GHOST_INACTIVE_DAYS = 14;
export const DECAY_GRACE_DAYS = 14;
export const DECAY_POINTS_PER_WEEK = 25;

export const BADGE_DEFINITIONS = {
  el_yacare: {
    label: "El Yacaré",
    emoji: "🐊",
    description: "Remontar un partido tras perder el primer set",
  },
  zapatero: {
    label: "Zapatero / Paseo en Coche",
    emoji: "🧹",
    description: "Ganar un set 6-0",
  },
  sello_fantasma: {
    label: "Sello Fantasma",
    emoji: "👻",
    description: "Pasar 14+ días sin jugar",
  },
  caza_gigantes: {
    label: "Caza Gigantes",
    emoji: "⚡",
    description: "Vencer a un rival con +300 pts de ranking",
  },
  papa_de_la_banda: {
    label: "Papá de la Banda",
    emoji: "👑",
    description: "Saldo a favor de ≥3 victorias contra un rival",
  },
  viernes_flex: {
    label: "Viernes Flex",
    emoji: "🏄‍♂️",
    description: "Registrar 2 o más partidos un mismo viernes",
  },
} as const;

export function getSkillLabel(level: SkillLevel): string {
  return SKILL_LEVELS.find((s) => s.value === level)?.label ?? level;
}

export function getInitialRating(level: SkillLevel): number {
  return SKILL_LEVELS.find((s) => s.value === level)?.rating ?? 800;
}
