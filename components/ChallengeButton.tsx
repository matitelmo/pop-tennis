"use client";

import { useState } from "react";
import { sendChallenge } from "@/lib/actions/challenge";
import { Button } from "@/components/ui/Button";

type Props = {
  opponentId: string;
  opponentName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function ChallengeButton({
  opponentId,
  opponentName,
  className = "",
  size = "md",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChallenge() {
    setLoading(true);
    setError(null);
    const res = await sendChallenge(opponentId);
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
