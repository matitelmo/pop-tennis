"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type {
  CommunitySettings,
  MatchConfirmationMode,
  SignupMode,
  WeeklyRivalMode,
} from "@/lib/community/settings";
import { DEFAULT_COMMUNITY_SETTINGS } from "@/lib/community/settings";
import type { MatchFormat } from "@/types/database";

const ALL_FORMATS: { value: MatchFormat; label: string }[] = [
  { value: "1v1_bo1", label: "1v1 BO1" },
  { value: "1v1_bo3", label: "1v1 BO3" },
  { value: "1v1_bo5", label: "1v1 BO5" },
  { value: "2v2_bo1", label: "2v2 BO1" },
  { value: "2v2_bo3", label: "2v2 BO3" },
  { value: "2v2_bo5", label: "2v2 BO5" },
];

type Props = {
  initial: CommunitySettings;
  onSubmit: (settings: CommunitySettings) => Promise<{ success: boolean; error?: string }>;
  showName?: { value: string; onChange: (v: string) => void };
};

export function CommunitySettingsForm({ initial, onSubmit, showName }: Props) {
  const [settings, setSettings] = useState<CommunitySettings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleFormat(format: MatchFormat) {
    setSettings((s) => ({
      ...s,
      allowed_formats: s.allowed_formats.includes(format)
        ? s.allowed_formats.filter((f) => f !== format)
        : [...s.allowed_formats, format],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const result = await onSubmit(settings);
    setLoading(false);
    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error ?? "Error al guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showName && (
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={showName.value}
            onChange={(e) => showName.onChange(e.target.value)}
            className="mt-1"
          />
        </div>
      )}

      <fieldset className="space-y-2">
        <Label>Confirmación de partidos</Label>
        <select
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={settings.match_confirmation}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              match_confirmation: e.target.value as MatchConfirmationMode,
            }))
          }
        >
          <option value="instant">Instantánea</option>
          <option value="pending">Pendiente (rival confirma)</option>
        </select>
      </fieldset>

      <div>
        <Label htmlFor="confirmation_hours">Horas para confirmar</Label>
        <Input
          id="confirmation_hours"
          type="number"
          min={1}
          max={168}
          value={settings.confirmation_hours}
          onChange={(e) =>
            setSettings((s) => ({ ...s, confirmation_hours: Number(e.target.value) }))
          }
          className="mt-1"
        />
      </div>

      <fieldset className="space-y-2">
        <Label>Modo de registro</Label>
        <select
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={settings.signup_mode}
          onChange={(e) =>
            setSettings((s) => ({ ...s, signup_mode: e.target.value as SignupMode }))
          }
        >
          <option value="open">Abierto</option>
          <option value="roster">Roster (Wild On style)</option>
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Rival semanal</Label>
        <select
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          value={settings.weekly_rival_mode}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              weekly_rival_mode: e.target.value as WeeklyRivalMode,
            }))
          }
        >
          <option value="auto">Automático</option>
          <option value="opt_in">Opt-in</option>
          <option value="off">Desactivado</option>
        </select>
      </fieldset>

      <div className="space-y-3">
        {(
          [
            ["requires_subscription", "Requiere suscripción"],
            ["leaderboard_gender_split", "Ranking por género"],
            ["leaderboard_quarterly_view", "Vista trimestral"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
              className="rounded border-white/20"
            />
            {label}
          </label>
        ))}
      </div>

      <fieldset>
        <Label>Formatos permitidos</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => toggleFormat(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                settings.allowed_formats.includes(f.value)
                  ? "bg-accent/20 text-accent"
                  : "bg-white/5 text-zinc-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-accent">Guardado</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando…" : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setSettings({ ...DEFAULT_COMMUNITY_SETTINGS })}
        >
          Reset defaults
        </Button>
      </div>
    </form>
  );
}
