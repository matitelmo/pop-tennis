import { Badge } from "@/components/ui/Badge";

type Props = {
  compact?: boolean;
};

export function GhostBadge({ compact }: Props) {
  if (compact) {
    return (
      <Badge variant="ghost" title="Fantasma — -25 pts/semana sin caer del Elo base">
        👻
      </Badge>
    );
  }

  return (
    <Badge variant="ghost" title="Fantasma — -25 pts/semana sin caer del Elo base">
      👻 Fantasmeando (-25 pts/sem)
    </Badge>
  );
}
