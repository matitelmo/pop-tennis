import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full min-h-[48px] rounded-xl border border-border bg-surface-glass px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1 block text-sm text-zinc-400", className)} {...props}>
      {children}
    </label>
  );
}
