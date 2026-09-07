"use client";

import { useState } from "react";
import Link from "next/link";
import { setWeeklyOptIn } from "@/lib/actions/weekly-match";
import { useCommunitySlug } from "@/hooks/useCommunitySlug";
import { communityPath } from "@/lib/community/paths";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = {
  optedIn: boolean;
  canOptIn: boolean;
  communitySlug?: string;
  showOptIn?: boolean;
};

export function WeeklyOptInToggle({
  optedIn: initial,
  canOptIn,
  communitySlug: communitySlugProp,
  showOptIn = true,
}: Props) {
  const communityFromRoute = useCommunitySlug();
  const communitySlug = communitySlugProp ?? communityFromRoute;
  const [optedIn, setOptedIn] = useState(initial);
  const [loading, setLoading] = useState(false);

  if (!showOptIn) return null;

  async function toggle() {
    if (!canOptIn) return;
    setLoading(true);
    const next = !optedIn;
    const res = await setWeeklyOptIn(communitySlug, next);
    if (res.success) setOptedIn(next);
    setLoading(false);
  }

  if (!canOptIn) {
    return (
      <Card className="border-border-subtle p-4">
        <p className="text-sm text-zinc-400">
          <Link href={communityPath(communitySlug, "subscribe")} className="font-bold text-accent">
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
