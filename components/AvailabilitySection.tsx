"use client";

import { useState } from "react";
import Link from "next/link";
import { AVAILABILITY_BLOCKS, AVAILABILITY_DAYS } from "@/lib/availability";
import { updateAvailability } from "@/lib/actions/availability";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Availability } from "@/types/database";

type Props = {
  initial: Availability | null;
  canEdit: boolean;
};

export function AvailabilitySection({ initial, canEdit }: Props) {
  const [availability, setAvailability] = useState<Availability>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    await updateAvailability(availability);
    setSaving(false);
    setSaved(true);
  }

  if (!canEdit) {
    return (
      <Card>
        <p className="text-sm text-zinc-400">
          <Link href="/subscribe" className="font-bold text-accent">
            Suscribite
          </Link>{" "}
          para configurar cuándo podés jugar y encontrar rivales con horarios similares.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold text-white">¿Cuándo podés jugar?</h3>
      <p className="mt-1 text-caption">Opcional — ayuda a encontrar rivales con horarios parecidos.</p>
      <div className="mt-4 space-y-3">
        {AVAILABILITY_DAYS.map((day) => (
          <div key={day.key}>
            <p className="mb-1 text-xs font-bold text-zinc-500">{day.label}</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_BLOCKS.map((block) => {
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
        {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar disponibilidad"}
      </Button>
    </Card>
  );
}
