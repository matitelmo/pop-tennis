import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ToastProvider } from "@/components/ToastProvider";
import { FirstRunOverlay } from "@/components/FirstRunOverlay";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser } from "@/lib/actions/match";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();
  let pendingCount = 0;
  if (profile) {
    const pending = await getPendingMatchesForUser(profile.id);
    pendingCount = pending.filter(
      (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
    ).length;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a0e14] pb-28">
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
