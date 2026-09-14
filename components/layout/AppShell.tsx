"use client";

import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { CommunityProvider } from "@/components/providers/CommunityProvider";
import type { CommunityLocale } from "@/lib/community/locale";

type Props = {
  communitySlug: string;
  communityName: string;
  communities: { slug: string; name: string }[];
  locale: CommunityLocale;
  showFindPlayers: boolean;
  pendingCount: number;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function AppShell({
  communitySlug,
  communityName,
  communities,
  locale,
  showFindPlayers,
  pendingCount,
  isAdmin,
  children,
}: Props) {
  return (
    <CommunityProvider slug={communitySlug} locale={locale} showFindPlayers={showFindPlayers}>
      <div className="min-h-screen overscroll-none bg-background lg:flex">
        <SideNav
          communitySlug={communitySlug}
          communityName={communityName}
          communities={communities}
          locale={locale}
          showFindPlayers={showFindPlayers}
          pendingCount={pendingCount}
          isAdmin={isAdmin}
        />
        <div className="flex min-h-screen flex-1 flex-col pb-28 lg:pb-8">
          <div className="app-container pt-6">{children}</div>
        </div>
        <BottomNav
          pendingCount={pendingCount}
          className="lg:hidden"
          communitySlug={communitySlug}
          locale={locale}
          showFindPlayers={showFindPlayers}
        />
      </div>
    </CommunityProvider>
  );
}
