"use client";

import { useParams } from "next/navigation";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/paths";

export function useCommunitySlug(): string {
  const params = useParams();
  return (params.community as string) ?? DEFAULT_COMMUNITY_SLUG;
}
