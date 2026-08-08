"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CONFIRMATION_HOURS } from "@/lib/constants";

export function FirstRunOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pop-first-run-done")) return;
    setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("pop-first-run-done", "1");
    setShow(false);
  }

  return (
    <Sheet open={show} onClose={dismiss} title="Así funciona Wild On Pop Tennis">
      <ol className="mt-4 space-y-3 text-body">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-accent-foreground">
            1
          </span>
          Cargá el resultado del partido en <strong className="text-white">Partido</strong>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-accent-foreground">
            2
          </span>
          Tu rival tiene {CONFIRMATION_HOURS}h para confirmar o proponer otro score
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-accent-foreground">
            3
          </span>
          Confirmado → subís o bajás en el ranking. Meta: 1 partido por semana
        </li>
      </ol>
      <div className="mt-6 flex gap-2">
        <Link href="/partido" onClick={dismiss} className="flex-1">
          <Button className="w-full">Cargar partido</Button>
        </Link>
        <Button variant="secondary" onClick={dismiss}>
          Entendido
        </Button>
      </div>
    </Sheet>
  );
}
