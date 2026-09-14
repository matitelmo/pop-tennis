import type { CommunityLocale } from "@/lib/community/locale";

const STORAGE_KEY = "pop-locale";

export function readLocalePreference(): CommunityLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "en" || value === "es" ? value : null;
  } catch {
    return null;
  }
}

export function writeLocalePreference(locale: CommunityLocale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore quota errors
  }
}
