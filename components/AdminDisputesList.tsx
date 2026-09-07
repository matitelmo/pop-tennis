"use client";

import { useState } from "react";
import { adminResolveMatch } from "@/lib/actions/match";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Match } from "@/types/database";

type Props = {
  matches: Match[];
  profileNames: Record<string, string>;
};

export function AdminDisputesList({ matches, profileNames }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function resolve(matchId: string, action: "confirm" | "delete") {
    setLoadingId(matchId);
    await adminResolveMatch(matchId, action);
    setLoadingId(null);
    window.location.reload();
  }

  if (!matches.length) {
    return (
      <Card>
        <p className="text-center text-sm text-zinc-400">No hay disputas pendientes.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((m) => {
        const team1 = (m.team1_ids ?? []) as string[];
        const team2 = (m.team2_ids ?? []) as string[];
        const names = [...team1, ...team2].map((id) => profileNames[id] ?? "?").join(" vs ");
        return (
          <Card key={m.id} className="border-danger/30 p-4">
            <p className="text-xs font-bold uppercase text-danger">Disputa</p>
            <p className="mt-1 font-medium text-white">{names}</p>
            <p className="text-caption">{m.format}</p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={loadingId === m.id}
                onClick={() => resolve(m.id, "confirm")}
              >
                Confirmar original
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled={loadingId === m.id}
                onClick={() => resolve(m.id, "delete")}
              >
                Anular
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
