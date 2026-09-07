"use client";

import { useState } from "react";
import {
  adminDeleteMatch,
  adminForceConfirmMatch,
} from "@/lib/actions/admin/matches";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Match } from "@/types/database";

type Props = {
  matches: Match[];
  profileNames: Record<string, string>;
  communitySlugs: Record<string, string>;
};

export function AdminMatchList({ matches, profileNames, communitySlugs }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function act(
    matchId: string,
    communitySlug: string,
    action: "confirm" | "delete"
  ) {
    setLoadingId(matchId);
    if (action === "confirm") {
      await adminForceConfirmMatch(communitySlug, matchId);
    } else {
      await adminDeleteMatch(communitySlug, matchId);
    }
    setLoadingId(null);
    window.location.reload();
  }

  if (!matches.length) {
    return (
      <Card>
        <p className="text-center text-sm text-zinc-400">No hay partidos.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const team1 = (m.team1_ids ?? []) as string[];
        const team2 = (m.team2_ids ?? []) as string[];
        const label = [...team1, ...team2].map((id) => profileNames[id] ?? "?").join(" vs ");
        const communitySlug = communitySlugs[m.community_id ?? ""] ?? "wild-on";

        return (
          <Card key={m.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase text-zinc-500">{m.status}</p>
                <p className="font-medium text-white">{label}</p>
                <p className="text-caption">
                  {m.format} · {communitySlug}
                </p>
              </div>
            </div>
            {m.status !== "confirmed" && (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={loadingId === m.id}
                  onClick={() => act(m.id, communitySlug, "confirm")}
                >
                  Confirmar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={loadingId === m.id}
                  onClick={() => act(m.id, communitySlug, "delete")}
                >
                  Borrar
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
