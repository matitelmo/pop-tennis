import { notFound } from "next/navigation";
import { getCommunityMembersForAdmin } from "@/lib/actions/admin/members";
import { getCommunityBySlug } from "@/lib/community/context";
import { MemberRow } from "@/components/admin/MemberRow";
import { MemberSearchAdd } from "@/components/admin/MemberSearchAdd";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminCommunityMembersPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const members = await getCommunityMembersForAdmin(slug);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Miembros</h2>
      <MemberSearchAdd communitySlug={slug} />
      <p className="text-sm text-zinc-500">{members.length} miembros</p>
      <div className="space-y-3">
        {members.map((m) => (
          <MemberRow key={m.id} communitySlug={slug} member={m} />
        ))}
      </div>
    </div>
  );
}
