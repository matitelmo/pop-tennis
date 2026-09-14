import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CommunityLocale } from "@/lib/community/locale";
import { formatDateLocalized, formatRelativeTimeLocalized } from "@/lib/i18n/format";
import { formatFormatLocalized } from "@/lib/i18n/format-format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(id: string): string {
  const colors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatDate(dateStr: string, locale: CommunityLocale = "es"): string {
  return formatDateLocalized(dateStr, locale);
}

export function formatRelativeTime(
  dateStr: string,
  locale: CommunityLocale = "es"
): string {
  return formatRelativeTimeLocalized(dateStr, locale);
}

export function formatFormat(format: string, locale: CommunityLocale = "es"): string {
  return formatFormatLocalized(format, locale);
}
