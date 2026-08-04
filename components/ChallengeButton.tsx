"use client";

import { shareViaWhatsApp } from "@/lib/share";
import { Button } from "@/components/ui/Button";

type Props = {
  opponentName: string;
  className?: string;
};

export function ChallengeButton({ opponentName, className = "" }: Props) {
  return (
    <Button
      type="button"
      onClick={() =>
        shareViaWhatsApp(
          `🎾 ¿Jugamos Pop Tennis esta semana, ${opponentName}? ${window.location.origin}/ranking`
        )
      }
      className={`w-full ${className}`}
    >
      Desafiar por WhatsApp
    </Button>
  );
}
