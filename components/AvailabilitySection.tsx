"use client";

import { useState } from "react";
import { getDayLabels, getBlockLabels } from "@/lib/i18n/messages";
import { updateAvailability } from "@/lib/actions/availability";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Availability } from "@/types/database";

type Props = {
  initial: Availability | null;
  canEdit: boolean;
  communitySlug?: string;
};

export function AvailabilitySection({ initial, canEdit, communitySlug: slugProp }: Props) {
  const { slug, locale, translate: tr } = useCommunity();
  const communitySlug = slugProp ?? slug;
  const [availability, setAvailability] = useState<Availability>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const days = getDayLabels(locale);
  const blocks = getBlockLabels(locale);

  function toggle(day: string, block: string) {
    if (!canEdit) return;
    setAvailability((prev) => {
      const dayBlocks = prev[day] ?? [];
      const next = dayBlocks.includes(block)
        ? dayBlocks.filter((b) => b !== block)
        : [...dayBlocks, block];
      return { ...prev, [day]: next };
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await updateAvailability(communitySlug, availability);
    setSaving(false);
    setSaved(true);
  }

  if (!canEdit) {
    return (
      <Card>
        <p className="text-sm text-zinc-400">{tr("subscribeToConfigureAvailability")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold text-white">{tr("whenCanYouPlay")}</h3>
      <p className="mt-1 text-caption">{tr("availabilityHint")}</p>
      <div className="mt-4 space-y-3">
        {days.map((day) => (
          <div key={day.key}>
            <p className="mb-1 text-xs font-bold text-zinc-500">{day.label}</p>
            <div className="flex flex-wrap gap-2">
              {blocks.map((block) => {
                const active = (availability[day.key] ?? []).includes(block.key);
                return (
                  <button
                    key={block.key}
                    type="button"
                    onClick={() => toggle(day.key, block.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-glass text-zinc-400"
                    )}
                  >
                    {block.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-4 w-full" size="sm" disabled={saving} onClick={save}>
        {saving ? tr("saving") : saved ? tr("saved") : tr("saveAvailability")}
      </Button>
    </Card>
  );
}
