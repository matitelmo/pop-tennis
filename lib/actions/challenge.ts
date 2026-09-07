"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { getCurrentUserProfile, getUserEmail } from "@/lib/actions/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { sendChallengeEmail } from "@/lib/email/send";

export async function sendChallenge(
  communitySlug: string,
  toUserId: string
): Promise<{ success: boolean; error?: string }> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const profile = await getCurrentUserProfile();
  if (!profile) return { success: false, error: "Perfil no encontrado" };

  const member = await getCommunityMember(community.id, user.id);
  if (!member) return { success: false, error: "No sos miembro de esta comunidad" };

  if (community.settings.requires_subscription && !hasActiveSubscription(member)) {
    return { success: false, error: "Necesitás suscripción activa para desafiar jugadores" };
  }

  if (toUserId === user.id) {
    return { success: false, error: "No podés desafiarte a vos mismo" };
  }

  const admin = createServiceClient();
  const { data: opponent } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", toUserId)
    .single();

  if (!opponent) return { success: false, error: "Jugador no encontrado" };

  await admin.from("challenges").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    community_id: community.id,
  });

  const opponentEmail = await getUserEmail(toUserId);
  if (opponentEmail) {
    await sendChallengeEmail({
      toEmail: opponentEmail,
      toName: opponent.full_name,
      fromName: profile.full_name,
      communitySlug,
    });
  }

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}
