"use server";

import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";

function isAdminUser(profile: Profile | null): profile is Profile {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(profile && adminId && profile.id === adminId);
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentUserProfile();
  if (!isAdminUser(profile)) {
    redirect("/communities");
  }
  return profile;
}

export async function assertAdmin(): Promise<
  { success: true; profile: Profile } | { success: false; error: string }
> {
  const profile = await getCurrentUserProfile();
  if (!isAdminUser(profile)) {
    return { success: false, error: "No autorizado" };
  }
  return { success: true, profile };
}
