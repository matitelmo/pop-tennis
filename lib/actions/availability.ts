"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { hasAvailabilityOverlap } from "@/lib/availability";
import type { Availability, Profile } from "@/types/database";

export async function updateAvailability(
  availability: Availability
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) return { success: false, error: "No autenticado" };
  if (!hasActiveSubscription(profile)) {
    return { success: false, error: "Necesitás suscripción activa para configurar disponibilidad" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ availability })
    .eq("id", profile.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { success: true };
}

export async function getPlayersWithSimilarAvailability(): Promise<
  (Profile & { overlapDays: number })[]
> {
  const profile = await getCurrentUserProfile();
  if (!profile?.availability) return [];

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", profile.id)
    .not("availability", "is", null);

  const results: (Profile & { overlapDays: number })[] = [];

  for (const p of profiles ?? []) {
    if (!hasAvailabilityOverlap(profile.availability, p.availability)) continue;
    let overlapDays = 0;
    for (const day of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
      const a = profile.availability?.[day] ?? [];
      const b = p.availability?.[day] ?? [];
      if (a.some((block: string) => b.includes(block))) overlapDays++;
    }
    results.push({ ...p, overlapDays });
  }

  return results.sort((a, b) => b.overlapDays - a.overlapDays);
}
