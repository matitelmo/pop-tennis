import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getGroupMatchHistory } from "@/lib/actions/history";
import { getCommunityBySlug } from "@/lib/community/context";
import { HistorialPageContent } from "@/components/HistorialPageContent";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function HistorialPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const { items: history, profileNames } = await getGroupMatchHistory(communitySlug);

  return (
    <HistorialPageContent
      communityName={community.name}
      communitySlug={communitySlug}
      history={history}
      profileNames={profileNames}
      currentUserId={profile.id}
    />
  );
}
