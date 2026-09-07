import type { Availability } from "@/types/database";

export const AVAILABILITY_DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
] as const;

export const AVAILABILITY_BLOCKS = [
  { key: "am", label: "Mañana" },
  { key: "pm", label: "Tarde" },
  { key: "eve", label: "Noche" },
] as const;

export function hasAvailabilityOverlap(a: Availability | null, b: Availability | null): boolean {
  if (!a || !b) return false;
  for (const day of AVAILABILITY_DAYS) {
    const blocksA = a[day.key] ?? [];
    const blocksB = b[day.key] ?? [];
    if (blocksA.some((block) => blocksB.includes(block))) return true;
  }
  return false;
}

export function countOverlappingDays(a: Availability | null, b: Availability | null): number {
  if (!a || !b) return 0;
  let count = 0;
  for (const day of AVAILABILITY_DAYS) {
    const blocksA = a[day.key] ?? [];
    const blocksB = b[day.key] ?? [];
    if (blocksA.some((block) => blocksB.includes(block))) count++;
  }
  return count;
}
