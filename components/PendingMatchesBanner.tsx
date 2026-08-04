"use client";

import { useRouter } from "next/navigation";
import { PendingMatchCard } from "@/components/PendingMatchCard";
import type { PendingMatch } from "@/lib/actions/match";

type Props = {
  matches: PendingMatch[];
  profileNames: Record<string, string>;
};

export function PendingMatchesBanner({ matches, profileNames }: Props) {
  const router = useRouter();
  const actionable = matches.filter(
    (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
  );

  if (!actionable.length) return null;

  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-sm font-bold text-amber-400">
        Tenés {actionable.length} partido{actionable.length > 1 ? "s" : ""} por revisar
      </h2>
      {actionable.map((m) => (
        <PendingMatchCard
          key={m.id}
          match={m}
          profileNames={profileNames}
          onDone={() => router.refresh()}
        />
      ))}
    </div>
  );
}
