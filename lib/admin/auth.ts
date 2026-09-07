"use server";

import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

function isAdminUser(profile: Profile | null): profile is Profile {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(profile && adminId && profile.id === adminId);
}

export async function getIsAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return isAdminUser(profile);
}

export async function requireAdmin(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const profile = await getCurrentUserProfile();
  if (!isAdminUser(profile)) {
    redirect("/communities?error=not-admin");
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
