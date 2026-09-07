"use client";

import Link from "next/link";
import { useState } from "react";
import { sendChallenge } from "@/lib/actions/challenge";

type Props = {
  id: string;
  name: string;
  variant?: "default" | "nudge" | "rival";
  daysInactive?: number;
  showChallenge?: boolean;
  canChallenge?: boolean;
};

export function PlayNudgeChip({
  id,
  name,
  variant = "default",
  daysInactive,
  showChallenge = false,
  canChallenge = false,
}: Props) {
  const [sent, setSent] = useState(false);

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

  async function handleChallenge(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (canChallenge) {
      const res = await sendChallenge(id);
      if (res.success) setSent(true);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Link
        href={`/perfil/${id}`}
        className={`min-h-[36px] rounded-full px-2.5 py-1 text-xs font-medium transition active:scale-95 ${styles}`}
      >
        {label}
      </Link>
      {showChallenge && canChallenge && (
        <button
          type="button"
          onClick={handleChallenge}
          disabled={sent}
          className="min-h-[36px] rounded-full bg-lime-500 px-2.5 text-[10px] font-bold text-black active:scale-95 disabled:opacity-60"
        >
          {sent ? "Enviado" : "Desafiar"}
        </button>
      )}
    </div>
  );
}
