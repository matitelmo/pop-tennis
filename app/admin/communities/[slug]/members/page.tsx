import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityMembersForAdmin } from "@/lib/actions/admin/members";
import { getCommunityBySlug } from "@/lib/community/context";
import { MemberRow } from "@/components/admin/MemberRow";
import { MemberSearchAdd } from "@/components/admin/MemberSearchAdd";
import { Button } from "@/components/ui/Button";

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Miembros · {community.name}</h2>
        <Link href={`/admin/communities/${slug}`}>
          <Button size="sm" variant="secondary">
            Settings
          </Button>
        </Link>
      </div>
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
