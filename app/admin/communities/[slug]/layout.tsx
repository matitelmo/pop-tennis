import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/community/context";
import { CommunityAdminNav } from "@/components/admin/CommunityAdminNav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function AdminCommunityLayout({ children, params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8">
      <CommunityAdminNav slug={slug} name={community.name} />
      <div>{children}</div>
    </div>
  );
}
