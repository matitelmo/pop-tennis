import { Minus, Plus } from "lucide-react";

type Props = {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
};

export function ScoreControl({ label, value, onDec, onInc }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDec}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 active:bg-white/20"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="w-10 text-center">
        <p className="text-[10px] text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onInc}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 active:bg-white/20"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
