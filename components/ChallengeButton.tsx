"use client";

import { useState } from "react";
import { sendChallenge } from "@/lib/actions/challenge";
import { useCommunitySlug } from "@/hooks/useCommunitySlug";
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
  const communityFromRoute = useCommunitySlug();
  const communitySlug = communitySlugProp ?? communityFromRoute;
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
        Desafío enviado
      </Button>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size={size}
        disabled={loading}
        onClick={handleChallenge}
        className="w-full"
      >
        {loading ? "Enviando..." : `Desafiar a ${opponentName.split(" ")[0]}`}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
