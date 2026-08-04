"use client";

import { shareViaWhatsApp } from "@/lib/share";

type Props = {
  opponentName: string;
  className?: string;
};

export function ChallengeButton({ opponentName, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={() =>
        shareViaWhatsApp(
          `🎾 ¿Jugamos Pop Tennis esta semana, ${opponentName}? ${window.location.origin}/ranking`
        )
      }
      className={`w-full min-h-[48px] rounded-xl bg-lime-500 font-bold text-black active:scale-[0.98] ${className}`}
    >
      Desafiar por WhatsApp
    </button>
  );
}
