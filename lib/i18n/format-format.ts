import type { CommunityLocale } from "@/lib/community/locale";

export function formatFormatLocalized(format: string, locale: CommunityLocale): string {
  const mapEs: Record<string, string> = {
    "1v1_bo1": "1v1 · 1 set",
    "1v1_bo3": "1v1 · Bo3",
    "1v1_bo5": "1v1 · Bo5",
    "2v2_bo1": "2v2 · 1 set",
    "2v2_bo3": "2v2 · Bo3",
    "2v2_bo5": "2v2 · Bo5",
  };
  const mapEn: Record<string, string> = {
    "1v1_bo1": "1v1 · 1 set",
    "1v1_bo3": "1v1 · Bo3",
    "1v1_bo5": "1v1 · Bo5",
    "2v2_bo1": "2v2 · 1 set",
    "2v2_bo3": "2v2 · Bo3",
    "2v2_bo5": "2v2 · Bo5",
  };
  const map = locale === "en" ? mapEn : mapEs;
  return map[format] ?? format;
}
