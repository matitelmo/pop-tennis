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

export const WEEKLY_MATCH_WIN_MULTIPLIER = 1.25;
export const WEEKLY_MATCH_RANK_WINDOW = 3;
export const WEEKLY_MATCH_COOLDOWN_WEEKS = 3;

export const GHOST_INACTIVE_DAYS = 14;
export const DECAY_GRACE_DAYS = 14;
export const DECAY_POINTS_PER_WEEK = 25;
export const MIN_RATING = 600;

export const BADGE_DEFINITIONS = {
  pequeno_charles: {
    label: "Pequeño Charles",
    emoji: "🎾",
    description: "Más partidos en el último mes calendario cerrado",
    story:
      "Estás para cualquiera: siempre que alguien quiere jugar, vos estás ahí. Sos el verdadero Pequeño Charles.",
  },
  gabo_moreti: {
    label: "Gabo Moreti",
    emoji: "🧹",
    description: "Mayor cantidad de sets ganados 6-0",
    story: "Sos el crack que golea a sus rivales.",
  },
  sello_fantasma: {
    label: "Sello Fantasma",
    emoji: "👻",
    description: "Pasar 14+ días sin jugar",
    story: "Apareciste en el ranking pero la cancha te extraña. Volvé antes de que te coma el decay.",
  },
  sorpresa_sauna: {
    label: "Sorpresa en el Sauna",
    emoji: "🧖",
    description: "Diste el mayor batacazo: le ganaste al rival con más diferencia de puntos",
    story:
      "Como cuando entrás a un sauna y te das cuenta que los muchachos no están tomando agua. Fuiste la sorpresa del grupo.",
  },
  el_padre: {
    label: "El Padre",
    emoji: "👑",
    description: "Le ganaste más veces a una misma persona que nadie del grupo",
    story: "Paternidades hay muchas, pero Padre del grupo hay una solo.",
  },
  fede_gorrisen: {
    label: "Fede Gorrisen",
    emoji: "🏄‍♂️",
    description: "Mayor cantidad de partidos jugados los viernes",
    story:
      "Redefinís el Viernes Flex: arrancaste con surf a la mañana y metiste Pop y pelotita.",
  },
} as const;

export function getSkillLabel(level: SkillLevel): string {
  return SKILL_LEVELS.find((s) => s.value === level)?.label ?? level;
}

export function getInitialRating(level: SkillLevel): number {
  return SKILL_LEVELS.find((s) => s.value === level)?.rating ?? 800;
}
