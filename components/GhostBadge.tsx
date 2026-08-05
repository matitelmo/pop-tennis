import { Badge } from "@/components/ui/Badge";

type Props = {
  compact?: boolean;
};

export function GhostBadge({ compact }: Props) {
  if (compact) {
    return (
      <Badge variant="ghost" title="Fantasma — -25 pts/semana (piso 600 pts)">
        👻
      </Badge>
    );
  }

  return (
    <Badge variant="ghost" title="Fantasma — -25 pts/semana (piso 600 pts)">
      👻 Fantasmeando (-25 pts/sem)
    </Badge>
  );
}
