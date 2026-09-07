import { getCommunityBySlug } from "@/lib/community/context";
import { notFound } from "next/navigation";
import { OpenRegisterForm } from "@/components/register/OpenRegisterForm";
import { RosterRegisterForm } from "@/components/register/RosterRegisterForm";

type Props = {
  searchParams: Promise<{ community?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { community: communitySlug = "wild-on" } = await searchParams;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  if (community.settings.signup_mode === "roster") {
    return <RosterRegisterForm communitySlug={communitySlug} communityName={community.name} />;
  }

  return <OpenRegisterForm communitySlug={communitySlug} communityName={community.name} />;
}
