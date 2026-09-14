"use client";

import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { CommunityProvider } from "@/components/providers/CommunityProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import type { CommunityLocale } from "@/lib/community/locale";

type Props = {
  communitySlug: string;
  communityName: string;
  communities: { slug: string; name: string }[];
  defaultLocale: CommunityLocale;
  showFindPlayers: boolean;
  showBadges: boolean;
  pendingCount: number;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function AppShell({
  communitySlug,
  communityName,
  communities,
  defaultLocale,
  showFindPlayers,
  showBadges,
  pendingCount,
  isAdmin,
  children,
}: Props) {
  return (
    <CommunityProvider
      slug={communitySlug}
      defaultLocale={defaultLocale}
      showFindPlayers={showFindPlayers}
      showBadges={showBadges}
    >
      <div className="min-h-screen overscroll-none bg-background lg:flex">
        <SideNav
          communitySlug={communitySlug}
          communityName={communityName}
          communities={communities}
          showFindPlayers={showFindPlayers}
          pendingCount={pendingCount}
          isAdmin={isAdmin}
        />
        <div className="relative flex min-h-screen flex-1 flex-col pb-36 lg:pb-8">
          <div className="app-container pt-6">{children}</div>
          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:hidden">
            <LocaleToggle compact />
          </div>
        </div>
        <BottomNav
          pendingCount={pendingCount}
          className="lg:hidden"
          communitySlug={communitySlug}
          showFindPlayers={showFindPlayers}
        />
      </div>
    </CommunityProvider>
  );
}
