import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunitySettingsForAdmin } from "@/lib/actions/admin/community";
import { CommunitySettingsEditor } from "@/components/admin/CommunitySettingsEditor";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminCommunityDetailPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunitySettingsForAdmin(slug);
  if (!community) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Configuración</h2>
        <Link href={`/admin/communities/${slug}/members`}>
          <Button size="sm" variant="secondary">
            Miembros
          </Button>
        </Link>
      </div>
      <CommunitySettingsEditor
        slug={slug}
        name={community.name}
        settings={community.settings}
      />
    </div>
  );
}
