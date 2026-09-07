import { revalidatePath } from "next/cache";

export const COMMUNITY_SLUGS = ["wild-on", "venice-beach"] as const;
export type CommunitySlug = (typeof COMMUNITY_SLUGS)[number];

export const DEFAULT_COMMUNITY_SLUG: CommunitySlug = "wild-on";

export function isCommunitySlug(slug: string): slug is CommunitySlug {
  return (COMMUNITY_SLUGS as readonly string[]).includes(slug);
}

export function communityPath(slug: string, segment: string): string {
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `/${slug}${normalized}`;
}

export function revalidateCommunityPaths(slug: string): void {
  for (const segment of ["ranking", "historial", "partido", "perfil", "reglas", "subscribe"]) {
    revalidatePath(communityPath(slug, segment));
  }
}

export const LEGACY_MAIN_PATHS = [
  "ranking",
  "historial",
  "partido",
  "perfil",
  "reglas",
  "subscribe",
] as const;
