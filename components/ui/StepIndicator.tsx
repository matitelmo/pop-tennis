import { cn } from "@/lib/utils";

type Props = {
  steps: string[];
  current: number;
  className?: string;
};

export function StepIndicator({ steps, current, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i + 1 === current ? "w-10 bg-accent" : i + 1 < current ? "w-8 bg-accent/60" : "w-8 bg-surface-glass"
            )}
          />
        ))}
      </div>
      <p className="text-center text-sm font-bold text-white">
        {current}. {steps[current - 1]}
      </p>
    </div>
  );
}
