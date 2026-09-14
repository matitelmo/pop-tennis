"use client";

import Link from "next/link";
import { Swords } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MatchHistoryList } from "@/components/MatchHistoryList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { communityPath } from "@/lib/community/paths";
import type { HistoryItem } from "@/lib/actions/history";

type Props = {
  communityName: string;
  communitySlug: string;
  history: HistoryItem[];
  profileNames: Record<string, string>;
  currentUserId: string;
};

export function HistorialPageContent({
  communityName,
  communitySlug,
  history,
  profileNames,
  currentUserId,
}: Props) {
  const { translate: tr } = useCommunity();

  return (
    <div>
      <AppHeader
        title={tr("history")}
        subtitle={`${tr("matchesSubtitle")} · ${communityName}`}
        sticky
      />

      {history.length === 0 ? (
        <Card className="py-10 text-center">
          <Swords className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-body">{tr("noHistory")}</p>
          <Link href={communityPath(communitySlug, "partido")} className="mt-4 inline-block">
            <Button size="sm">{tr("loadFirstMatch")}</Button>
          </Link>
        </Card>
      ) : (
        <div className="app-page">
          <MatchHistoryList
            items={history}
            profileNames={profileNames}
            currentUserId={currentUserId}
            variant="group"
            showEmptyAction={false}
            communitySlug={communitySlug}
          />
        </div>
      )}
    </div>
  );
}
