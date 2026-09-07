"use client";

import { useState } from "react";
import {
  createRosterPreset,
  deleteRosterPreset,
  updateRosterPreset,
} from "@/lib/actions/admin/roster";
import { SKILL_LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { RosterPlayer, SkillLevel } from "@/types/database";

type Props = {
  communitySlug: string;
  roster: RosterPlayer[];
};

export function RosterAdminTable({ communitySlug, roster: initialRoster }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    setLoading(true);
    setMessage(null);
    const result = await createRosterPreset(communitySlug, {
      displayName,
      skillLevel,
      isPreset: true,
    });
    setLoading(false);
    if (result.success) window.location.reload();
    else setMessage(result.error ?? "Error");
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar preset del roster?")) return;
    setLoading(true);
    const result = await deleteRosterPreset(id);
    setLoading(false);
    if (result.success) window.location.reload();
    else setMessage(result.error ?? "Error");
  }

  async function handleUpdate(id: string, rating: number) {
    setLoading(true);
    const result = await updateRosterPreset(id, { rating });
    setLoading(false);
    setMessage(result.success ? "Actualizado" : (result.error ?? "Error"));
    if (result.success) window.location.reload();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-medium text-white">Nuevo preset</p>
        <p className="mt-1 text-xs text-zinc-500">
          En comunidades con roster (Wild On), los presets sin reclamar aparecen al cargar partidos y
          en el ranking. Cuando se registren, heredan su rating.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 min-w-[140px]"
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            {SKILL_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <Button type="button" onClick={handleAdd} disabled={loading || displayName.length < 2}>
            Agregar
          </Button>
        </div>
        {message && <p className="mt-2 text-sm text-zinc-400">{message}</p>}
      </Card>

      <div className="space-y-2">
        {initialRoster.map((r) => (
          <Card key={r.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-white">
                  {r.display_name}
                  {r.is_preset && (
                    <span className="ml-2 text-xs text-accent">preset</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {r.suggested_skill_level} · {r.suggested_rating} pts
                  {r.claimed_by ? " · reclamado" : " · libre"}
                </p>
              </div>
              {!r.claimed_by && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdate(r.id, r.suggested_rating + 50)}
                    disabled={loading}
                  >
                    +50
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(r.id)}
                    disabled={loading}
                  >
                    Borrar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
