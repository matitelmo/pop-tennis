"use server";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { parseCommunitySettings } from "@/lib/community/settings";
import type { Community, CommunityMember, Profile } from "@/types/database";

export type CommunityWithSettings = Community & {
  settings: ReturnType<typeof parseCommunitySettings>;
};

export async function getCommunityBySlug(slug: string): Promise<CommunityWithSettings | null> {
  const admin = createServiceClient();
  const { data } = await admin.from("communities").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  return {
    ...(data as Community),
    settings: parseCommunitySettings(data.settings),
  };
}

export async function getAllCommunities(): Promise<CommunityWithSettings[]> {
  const admin = createServiceClient();
  const { data } = await admin.from("communities").select("*").order("name");
  return (data ?? []).map((c) => ({
    ...(c as Community),
    settings: parseCommunitySettings(c.settings),
  }));
}

export async function getCommunityMember(
  communityId: string,
  userId: string
): Promise<(CommunityMember & { profile: Profile }) | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("community_members")
    .select("*, profile:profiles(*)")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const { profile, ...member } = data as CommunityMember & { profile: Profile };
  return { ...member, profile };
}

export async function getUserCommunities(userId: string): Promise<CommunityWithSettings[]> {
  const admin = createServiceClient();
  const { data: rows } = await admin
    .from("community_members")
    .select("community_id, communities(*)")
    .eq("user_id", userId);

  return (rows ?? []).map((row) => {
    const c = row.communities as unknown as Community;
    return { ...c, settings: parseCommunitySettings(c.settings) };
  });
}

export async function getLastCommunitySlug(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("last_community")?.value ?? null;
}

export async function setLastCommunitySlug(slug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("last_community", slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export type CommunityMemberProfile = Profile & {
  member: CommunityMember;
};

export async function getCommunityMembers(communityId: string): Promise<CommunityMemberProfile[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("community_members")
    .select("*, profile:profiles(*)")
    .eq("community_id", communityId);

  return (data ?? []).map((row) => {
    const { profile, ...member } = row as CommunityMember & { profile: Profile };
    return { ...profile, member };
  });
}
