"use client";

import Link from "next/link";
import { shareViaWhatsApp } from "@/lib/share";

type Props = {
  id: string;
  name: string;
  variant?: "default" | "nudge" | "rival";
  daysInactive?: number;
  showChallenge?: boolean;
};

export function PlayNudgeChip({
  id,
  name,
  variant = "default",
  daysInactive,
  showChallenge = false,
}: Props) {
  const styles =
    variant === "nudge"
      ? "bg-orange-500/20 text-orange-400"
      : variant === "rival"
        ? "bg-lime-500/20 text-lime-400"
        : "bg-white/10 text-zinc-300";

  const label =
    variant === "nudge" && daysInactive
      ? `${daysInactive}d sin jugar`
      : name;

  function handleChallenge(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    shareViaWhatsApp(
      `🎾 ¿Jugamos Pop Tennis esta semana, ${name}? ${window.location.origin}/ranking`
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Link
        href={`/perfil/${id}`}
        className={`min-h-[36px] rounded-full px-2.5 py-1 text-xs font-medium transition active:scale-95 ${styles}`}
      >
        {label}
      </Link>
      {showChallenge && (
        <button
          type="button"
          onClick={handleChallenge}
          className="min-h-[36px] rounded-full bg-lime-500 px-2.5 text-[10px] font-bold text-black active:scale-95"
        >
          Desafiar
        </button>
      )}
    </div>
  );
}
