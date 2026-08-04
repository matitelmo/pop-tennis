"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function FirstRunOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pop-first-run-done")) return;
    setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("pop-first-run-done", "1");
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-lime-400/30 bg-[#121820] p-6">
        <h2 className="text-xl font-black text-white">Así funciona Pop Tennis</h2>
        <ol className="mt-4 space-y-3 text-sm text-zinc-300">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-500 text-xs font-black text-black">
              1
            </span>
            Cargá el resultado del partido en <strong className="text-white">Partido</strong>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-500 text-xs font-black text-black">
              2
            </span>
            Tu rival tiene 24h para confirmar o proponer otro score
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-500 text-xs font-black text-black">
              3
            </span>
            Confirmado → subís o bajás en el ranking. Meta: 1 partido por semana
          </li>
        </ol>
        <div className="mt-6 flex gap-2">
          <Link
            href="/partido"
            onClick={dismiss}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-lime-500 font-bold text-black active:scale-[0.98]"
          >
            Cargar partido
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[48px] rounded-xl border border-white/10 px-4 text-sm text-zinc-300"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
