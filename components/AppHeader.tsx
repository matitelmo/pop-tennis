import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  sticky?: boolean;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Volver",
  action,
  sticky = false,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "mb-6",
        sticky &&
          "sticky top-0 z-10 -mx-4 border-b border-border-subtle bg-background/95 px-4 pb-4 pt-2 backdrop-blur-lg",
        className
      )}
      style={{ viewTransitionName: "app-header" }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex min-h-[44px] items-center gap-1 text-sm text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {title === "Wild On Pop Tennis" && (
              <Trophy className="h-6 w-6 shrink-0 text-accent" aria-hidden />
            )}
            <h1 className="text-display truncate">{title}</h1>
          </div>
          {subtitle && <p className="mt-1 text-caption">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
