import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-accent font-bold text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent",
  secondary:
    "border border-border bg-surface-glass font-medium text-zinc-300 hover:bg-white/10 focus-visible:ring-zinc-400",
  ghost: "font-medium text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:ring-zinc-400",
  destructive:
    "bg-danger/10 font-bold text-danger hover:bg-danger/20 focus-visible:ring-danger",
};

const sizes = {
  sm: "min-h-[40px] rounded-lg px-3 text-sm",
  md: "min-h-[44px] rounded-xl px-4 text-sm",
  lg: "min-h-[52px] rounded-xl px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
