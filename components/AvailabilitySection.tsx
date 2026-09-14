"use client";

import { useState } from "react";
import { getDayLabels, getHourLabels } from "@/lib/i18n/messages";
import { updateAvailability } from "@/lib/actions/availability";
import { ScheduleChip } from "@/components/ScheduleChip";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  const hours = getHourLabels(locale);

  function toggle(day: string, hour: string) {
    if (!canEdit) return;
    setAvailability((prev) => {
      const dayHours = prev[day] ?? [];
      const next = dayHours.includes(hour)
        ? dayHours.filter((h) => h !== hour)
        : [...dayHours, hour];
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
      <div className="mt-4 space-y-4">
        {days.map((day) => (
          <div key={day.key}>
            <p className="mb-2 text-xs font-bold text-zinc-500">{day.label}</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
              {hours.map((hour) => (
                <ScheduleChip
                  key={hour.key}
                  label={hour.label}
                  active={(availability[day.key] ?? []).includes(hour.key)}
                  onClick={() => toggle(day.key, hour.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-4 w-full" size="md" disabled={saving} onClick={save}>
        {saving ? tr("saving") : saved ? tr("saved") : tr("saveAvailability")}
      </Button>
    </Card>
  );
}
