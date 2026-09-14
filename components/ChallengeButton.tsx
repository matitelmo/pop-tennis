"use client";

import { useState } from "react";
import { sendChallenge } from "@/lib/actions/challenge";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Button } from "@/components/ui/Button";

type Props = {
  opponentId: string;
  opponentName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  communitySlug?: string;
};

export function ChallengeButton({
  opponentId,
  opponentName,
  className = "",
  size = "md",
  communitySlug: communitySlugProp,
}: Props) {
  const { slug, translate: tr } = useCommunity();
  const communitySlug = communitySlugProp ?? slug;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChallenge() {
    setLoading(true);
    setError(null);
    const res = await sendChallenge(communitySlug, opponentId);
    setLoading(false);
    if (res.success) setSent(true);
    else setError(res.error ?? "Error");
  }

  if (sent) {
    return (
      <Button type="button" variant="secondary" size={size} disabled className={className}>
        {tr("challengeSent")}
      </Button>
    );
  }

  const firstName = opponentName.split(" ")[0];

  return (
    <div className={className}>
      <Button
        type="button"
        size={size}
        disabled={loading}
        onClick={handleChallenge}
        className="w-full"
      >
        {loading ? tr("sending") : `${tr("challenge")} ${firstName}`}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
