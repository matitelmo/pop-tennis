import { AppShell } from "@/components/layout/AppShell";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ToastProvider } from "@/components/ToastProvider";
import { FirstRunOverlay } from "@/components/FirstRunOverlay";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser } from "@/lib/actions/match";
import { getAllCommunities, getCommunityBySlug } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { getIsAdmin } from "@/lib/admin/auth";
import { checkGhostBadgeForUser } from "@/lib/badges";
import { notFound } from "next/navigation";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ community: string }>;
}) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const [profile, communities, isAdmin] = await Promise.all([
    getCurrentUserProfile(),
    getAllCommunities(),
    getIsAdmin(),
  ]);

  let pendingCount = 0;
  if (profile) {
    const pending = await getPendingMatchesForUser(community.id, profile.id);
    pendingCount = pending.filter(
      (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
    ).length;
    await checkGhostBadgeForUser(profile.id);
  }

  const locale = getCommunityLocale(communitySlug);
  const showFindPlayers = community.settings.player_finder;

  return (
    <ToastProvider>
      <AppShell
        communitySlug={communitySlug}
        communityName={community.name}
        communities={communities.map((c) => ({ slug: c.slug, name: c.name }))}
        locale={locale}
        showFindPlayers={showFindPlayers}
        pendingCount={pendingCount}
        isAdmin={isAdmin}
      >
        <InstallPrompt />
        {children}
      </AppShell>
      <FirstRunOverlay />
    </ToastProvider>
  );
}
