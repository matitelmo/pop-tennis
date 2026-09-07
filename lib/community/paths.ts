import { revalidatePath } from "next/cache";
import { isValidSlugFormat } from "@/lib/community/slug-format";

export type CommunitySlug = string;

export const DEFAULT_COMMUNITY_SLUG = "wild-on";

export function isCommunitySlug(slug: string): slug is CommunitySlug {
  return isValidSlugFormat(slug);
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

/** First URL segments that are app routes, not community slugs. */
export const RESERVED_APP_PATHS = [
  "admin",
  "communities",
  "login",
  "register",
  "join",
  "api",
] as const;

export function isReservedAppPath(segment: string): boolean {
  return (RESERVED_APP_PATHS as readonly string[]).includes(segment);
}
