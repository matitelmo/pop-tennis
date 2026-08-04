import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "warning" | "danger" | "ghost";
};

const variants = {
  default: "bg-surface-glass text-zinc-300 border-border-subtle",
  accent: "bg-accent-muted text-accent border-accent/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  ghost: "bg-zinc-700/50 text-zinc-300 border-transparent",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
