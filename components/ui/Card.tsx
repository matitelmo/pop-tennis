import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "interactive";
};

const variants = {
  default: "border border-border-subtle bg-surface-glass",
  elevated: "border border-border bg-surface accent-line-top shadow-xl",
  interactive:
    "border border-border-subtle bg-surface-glass transition active:scale-[0.99] hover:border-border",
};

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl p-4", variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
