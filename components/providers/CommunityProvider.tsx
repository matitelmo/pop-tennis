"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CommunityLocale } from "@/lib/community/locale";
import { readLocalePreference, writeLocalePreference } from "@/lib/i18n/locale-preference";
import { t, type MessageKey } from "@/lib/i18n/messages";

type CommunityContextValue = {
  slug: string;
  locale: CommunityLocale;
  showFindPlayers: boolean;
  showBadges: boolean;
  setLocale: (locale: CommunityLocale) => void;
  translate: (key: MessageKey) => string;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

type Props = {
  slug: string;
  defaultLocale: CommunityLocale;
  showFindPlayers: boolean;
  showBadges: boolean;
  children: ReactNode;
};

export function CommunityProvider({
  slug,
  defaultLocale,
  showFindPlayers,
  showBadges,
  children,
}: Props) {
  const [locale, setLocaleState] = useState<CommunityLocale>(defaultLocale);

  useEffect(() => {
    const stored = readLocalePreference();
    if (stored) setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: CommunityLocale) => {
    setLocaleState(next);
    writeLocalePreference(next);
  }, []);

  const value: CommunityContextValue = {
    slug,
    locale,
    showFindPlayers,
    showBadges,
    setLocale,
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
