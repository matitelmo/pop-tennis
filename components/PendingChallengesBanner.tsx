"use client";

import Link from "next/link";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Card } from "@/components/ui/Card";
import { communityPath } from "@/lib/community/paths";
import type { IncomingChallenge } from "@/lib/actions/challenges-inbox";

type Props = {
  challenges: IncomingChallenge[];
  communitySlug: string;
};

export function PendingChallengesBanner({ challenges, communitySlug }: Props) {
  const { locale } = useCommunity();

  if (!challenges.length) return null;

  return (
    <div className="space-y-2">
      {challenges.map((c) => (
        <Card key={c.id} className="border-accent/30 bg-accent-muted/20 p-4">
          <p className="text-sm text-white">
            {locale === "en" ? (
              <>
                <strong>{c.fromName}</strong> wants to play you — reach out to schedule a match!
              </>
            ) : (
              <>
                <strong>{c.fromName}</strong> te desafió — contactalo para armar el partido.
              </>
            )}
          </p>
          <Link
            href={communityPath(communitySlug, `perfil/${c.fromUserId}`)}
            className="mt-2 inline-block text-xs font-bold text-accent hover:underline"
          >
            {locale === "en" ? "View profile" : "Ver perfil"}
          </Link>
        </Card>
      ))}
    </div>
  );
}
