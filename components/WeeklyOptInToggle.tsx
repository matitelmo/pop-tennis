"use client";

import { useState } from "react";
import { setWeeklyOptIn } from "@/lib/actions/weekly-match";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Props = {
  optedIn: boolean;
  canOptIn: boolean;
};

export function WeeklyOptInToggle({ optedIn: initial, canOptIn }: Props) {
  const [optedIn, setOptedIn] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!canOptIn) return;
    setLoading(true);
    const next = !optedIn;
    const res = await setWeeklyOptIn(next);
    if (res.success) setOptedIn(next);
    setLoading(false);
  }

  if (!canOptIn) {
    return (
      <Card className="border-border-subtle p-4">
        <p className="text-sm text-zinc-400">
          <Link href="/subscribe" className="font-bold text-accent">
            Suscribite
          </Link>{" "}
          para sumarte al rival semanal (bonus ×1.25 al ganar).
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-accent/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-white">Rival semanal</p>
          <p className="text-caption">Opt-in · bonus ×1.25 si ganás el 1v1</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={optedIn ? "secondary" : "primary"}
          disabled={loading}
          onClick={toggle}
        >
          {optedIn ? "Salir" : "Sumarme"}
        </Button>
      </div>
    </Card>
  );
}
