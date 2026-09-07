"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { isValidSlugFormat } from "@/lib/community/slug-format";

export async function communityExists(slug: string): Promise<boolean> {
  if (!isValidSlugFormat(slug)) return false;
  const admin = createServiceClient();
  const { data } = await admin.from("communities").select("slug").eq("slug", slug).maybeSingle();
  return Boolean(data);
}

export async function getAllCommunitySlugs(): Promise<string[]> {
  const admin = createServiceClient();
  const { data } = await admin.from("communities").select("slug").order("slug");
  return (data ?? []).map((c) => c.slug);
}
