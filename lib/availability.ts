import type { Availability } from "@/types/database";
import type { CommunityLocale } from "@/lib/community/locale";

export const AVAILABILITY_DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
] as const;

/** Hour slots from 7:00 through 20:00 (inclusive), one hour each. */
export const AVAILABILITY_HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export const AVAILABILITY_HOUR_KEYS = AVAILABILITY_HOURS.map(String);

/** @deprecated Legacy blocks — kept for reading old saved data. */
export const AVAILABILITY_BLOCKS = [
  { key: "am", label: "Mañana" },
  { key: "pm", label: "Tarde" },
  { key: "eve", label: "Noche" },
] as const;

export function formatAvailabilityHour(hour: number, locale: CommunityLocale): string {
  if (locale === "en") {
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }
  return `${hour}:00`;
}

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
