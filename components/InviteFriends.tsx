"use client";

import { useState } from "react";
import { buildInviteLink, buildInviteShareText, shareViaWhatsApp } from "@/lib/share";

type Props = {
  inviteCode: string;
};

export function InviteFriends({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  if (!inviteCode) return null;

  const link = buildInviteLink(inviteCode);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <h3 className="font-bold text-white">Invitar amigos</h3>
      <p className="mt-1 text-xs text-zinc-400">
        Mandá este link por WhatsApp para sumar gente al grupo
      </p>
      <p className="mt-3 break-all rounded-lg bg-black/30 p-2 font-mono text-xs text-lime-400">
        {link}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={copyLink}
          className="min-h-[44px] flex-1 rounded-xl border border-white/10 text-sm font-medium text-zinc-200"
        >
          {copied ? "Copiado!" : "Copiar link"}
        </button>
        <button
          onClick={() => shareViaWhatsApp(buildInviteShareText(inviteCode))}
          className="min-h-[44px] flex-1 rounded-xl bg-lime-500 text-sm font-bold text-black"
        >
          WhatsApp
        </button>
      </div>
    </div>
  );
}
