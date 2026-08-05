"use client";

import { Trash2 } from "lucide-react";
import { ScoreControl } from "@/components/ScoreControl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  canAddSet,
  getSetValidationError,
} from "@/lib/match/set-scores";
import type { SetScore } from "@/types/database";

type Props = {
  setScores: SetScore[];
  onChange: (scores: SetScore[]) => void;
  bestOf: 3 | 5;
};

export function SetScoresEditor({ setScores, onChange, bestOf }: Props) {
  const updateSet = (index: number, side: "p1" | "p2", delta: number) => {
    onChange(
      setScores.map((s, i) =>
        i === index ? { ...s, [side]: Math.max(0, Math.min(7, s[side] + delta)) } : s
      )
    );
  };

  const removeSet = (index: number) => {
    if (setScores.length <= 1) return;
    onChange(setScores.filter((_, i) => i !== index));
  };

  const addSet = () => {
    if (!canAddSet(setScores, bestOf)) return;
    onChange([...setScores, { p1: 0, p2: 0 }]);
  };

  return (
    <div className="space-y-3">
      {setScores.map((set, i) => {
        const setError = getSetValidationError(set);
        return (
          <Card key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-400">Set {i + 1}</span>
              {setScores.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(i)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition active:bg-danger/10 active:text-danger"
                  aria-label={`Eliminar set ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <ScoreControl
                label="Eq1"
                value={set.p1}
                onDec={() => updateSet(i, "p1", -1)}
                onInc={() => updateSet(i, "p1", 1)}
              />
              <span className="text-zinc-600">-</span>
              <ScoreControl
                label="Eq2"
                value={set.p2}
                onDec={() => updateSet(i, "p2", -1)}
                onInc={() => updateSet(i, "p2", 1)}
              />
            </div>
            {setError && <p className="text-xs text-warning">{setError}</p>}
          </Card>
        );
      })}

      {canAddSet(setScores, bestOf) && (
        <Button type="button" variant="secondary" onClick={addSet} className="w-full">
          + Agregar set
        </Button>
      )}
    </div>
  );
}
