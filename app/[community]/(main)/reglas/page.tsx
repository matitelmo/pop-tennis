import { RulesGuide } from "@/components/RulesGuide";
import { RulesGuideEn } from "@/components/RulesGuideEn";
import { AppHeader } from "@/components/AppHeader";
import { getCommunityBySlug } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function ReglasPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const locale = getCommunityLocale(communitySlug);
  const isEn = locale === "en";

  return (
    <div>
      <AppHeader
        title={isEn ? "Rules & Scoring" : "Reglas & Scoring"}
        subtitle={
          isEn
            ? "Everything you need to understand the ranking"
            : "Todo lo que necesitás saber para entender el ranking"
        }
        sticky
      />
      {isEn ? (
        <RulesGuideEn showBadges={community.settings.show_badges} />
      ) : (
        <RulesGuide />
      )}
    </div>
  );
}
