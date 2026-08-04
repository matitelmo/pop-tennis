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
  papa_del_grupo: {
    label: "Papá del Grupo",
    emoji: "👑",
    description: "Ganarle 5 partidos seguidos al mismo rival",
  },
  caza_gigantes: {
    label: "Caza Gigantes",
    emoji: "🦁",
    description: "Ganarle a alguien con +300 pts de Elo",
  },
  paseo_en_coche: {
    label: "Paseo en Coche",
    emoji: "🧹",
    description: "Ganar un Bo5 por 3-0",
  },
  inviolable: {
    label: "Inviolable",
    emoji: "🧱",
    description: "Ganar un set 6-0",
  },
  lomo_de_metal: {
    label: "Lomo de Metal",
    emoji: "🏃",
    description: "Jugar 5 partidos en la misma semana",
  },
} as const;

export function getSkillLabel(level: SkillLevel): string {
  return SKILL_LEVELS.find((s) => s.value === level)?.label ?? level;
}

export function getInitialRating(level: SkillLevel): number {
  return SKILL_LEVELS.find((s) => s.value === level)?.rating ?? 800;
}
