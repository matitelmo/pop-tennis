import { Skeleton } from "@/components/ui/Sheet";

type Props = {
  rows?: number;
};

export function PageSkeleton({ rows = 6 }: Props) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
