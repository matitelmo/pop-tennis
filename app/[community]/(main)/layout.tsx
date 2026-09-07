import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ToastProvider } from "@/components/ToastProvider";
import { FirstRunOverlay } from "@/components/FirstRunOverlay";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser } from "@/lib/actions/match";
import { getCommunityBySlug } from "@/lib/community/context";
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

  const profile = await getCurrentUserProfile();
  let pendingCount = 0;
  if (profile) {
    const pending = await getPendingMatchesForUser(community.id, profile.id);
    pendingCount = pending.filter(
      (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
    ).length;
    await checkGhostBadgeForUser(profile.id);
  }

  return (
    <ToastProvider>
      <div className="min-h-screen overscroll-none bg-background pb-28">
        <div className="mx-auto max-w-md px-4 pt-6">
          <InstallPrompt />
          {children}
        </div>
        <BottomNav pendingCount={pendingCount} />
        <FirstRunOverlay />
      </div>
    </ToastProvider>
  );
}
