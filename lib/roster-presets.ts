import type { SkillLevel } from "@/types/database";

export type RosterPreset = {
  displayName: string;
  skillLevel: SkillLevel;
  rating: number;
};

export const ROSTER_PRESETS: RosterPreset[] = [
  { displayName: "Mati Telmo", skillLevel: "advanced", rating: 1200 },
  { displayName: "Andy", skillLevel: "expert", rating: 1300 },
  { displayName: "Charlie", skillLevel: "advanced", rating: 1200 },
  { displayName: "Eli", skillLevel: "advanced", rating: 1200 },
  { displayName: "Fran", skillLevel: "expert", rating: 1300 },
  { displayName: "Lucas", skillLevel: "intermediate", rating: 1100 },
  { displayName: "Marian", skillLevel: "beginner", rating: 1000 },
  { displayName: "Mata", skillLevel: "advanced", rating: 1200 },
  { displayName: "Mati Viel", skillLevel: "intermediate", rating: 1100 },
  { displayName: "Mica", skillLevel: "beginner", rating: 1000 },
  { displayName: "Papi", skillLevel: "beginner", rating: 1000 },
  { displayName: "Pilo", skillLevel: "expert", rating: 1300 },
  { displayName: "Rama", skillLevel: "beginner", rating: 1000 },
  { displayName: "Tomi Laporta", skillLevel: "intermediate", rating: 1100 },
];
