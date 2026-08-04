import type { SkillLevel } from "@/types/database";

export type RosterPreset = {
  displayName: string;
  skillLevel: SkillLevel;
  rating: number;
};

export const ROSTER_PRESETS: RosterPreset[] = [
  { displayName: "Mati Telmo", skillLevel: "advanced", rating: 1600 },
  { displayName: "Andy", skillLevel: "expert", rating: 2000 },
  { displayName: "Charlie", skillLevel: "advanced", rating: 1600 },
  { displayName: "Eli", skillLevel: "advanced", rating: 1600 },
  { displayName: "Fran", skillLevel: "expert", rating: 2000 },
  { displayName: "Lucas", skillLevel: "intermediate", rating: 1200 },
  { displayName: "Marian", skillLevel: "beginner", rating: 800 },
  { displayName: "Mata", skillLevel: "advanced", rating: 1600 },
  { displayName: "Mati Viel", skillLevel: "intermediate", rating: 1200 },
  { displayName: "Mica", skillLevel: "beginner", rating: 800 },
  { displayName: "Papi", skillLevel: "beginner", rating: 800 },
  { displayName: "Pilo", skillLevel: "expert", rating: 2000 },
  { displayName: "Rama", skillLevel: "beginner", rating: 800 },
  { displayName: "Tomi Laporta", skillLevel: "intermediate", rating: 1200 },
];
