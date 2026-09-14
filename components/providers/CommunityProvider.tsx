"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CommunityLocale } from "@/lib/community/locale";
import { t, type MessageKey } from "@/lib/i18n/messages";

type CommunityContextValue = {
  slug: string;
  locale: CommunityLocale;
  showFindPlayers: boolean;
  translate: (key: MessageKey) => string;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

type Props = {
  slug: string;
  locale: CommunityLocale;
  showFindPlayers: boolean;
  children: ReactNode;
};

export function CommunityProvider({ slug, locale, showFindPlayers, children }: Props) {
  const value: CommunityContextValue = {
    slug,
    locale,
    showFindPlayers,
    translate: (key) => t(locale, key),
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) {
    throw new Error("useCommunity must be used within CommunityProvider");
  }
  return ctx;
}

export function useOptionalCommunity() {
  return useContext(CommunityContext);
}
