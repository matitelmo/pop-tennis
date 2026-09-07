"use client";

import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/layout/SideNav";

type Props = {
  communitySlug: string;
  communityName: string;
  communities: { slug: string; name: string }[];
  pendingCount: number;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function AppShell({
  communitySlug,
  communityName,
  communities,
  pendingCount,
  isAdmin,
  children,
}: Props) {
  return (
    <div className="min-h-screen overscroll-none bg-background lg:flex">
      <SideNav
        communitySlug={communitySlug}
        communityName={communityName}
        communities={communities}
        pendingCount={pendingCount}
        isAdmin={isAdmin}
      />
      <div className="flex min-h-screen flex-1 flex-col pb-28 lg:pb-8">
        <div className="app-container pt-6">{children}</div>
      </div>
      <BottomNav pendingCount={pendingCount} className="lg:hidden" />
    </div>
  );
}
