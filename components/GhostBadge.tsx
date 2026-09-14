"use client";

import { Badge } from "@/components/ui/Badge";
import { useOptionalCommunity } from "@/components/providers/CommunityProvider";
import { t } from "@/lib/i18n/messages";

type Props = {
  compact?: boolean;
};

export function GhostBadge({ compact }: Props) {
  const community = useOptionalCommunity();
  const locale = community?.locale ?? "es";
  const title = t(locale, "ghostBadge");

  if (compact) {
    return (
      <Badge variant="ghost" title={title}>
        👻
      </Badge>
    );
  }

  return (
    <Badge variant="ghost" title={title}>
      👻 {locale === "en" ? "Inactive (-25/wk)" : "Fantasmeando (-25 pts/sem)"}
    </Badge>
  );
}
