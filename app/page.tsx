import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCommunities } from "@/lib/community/context";
import { communityPath, DEFAULT_COMMUNITY_SLUG } from "@/lib/community/paths";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/communities");
  }

  const memberships = await getUserCommunities(user.id);
  if (memberships.length === 1) {
    redirect(communityPath(memberships[0].slug, "ranking"));
  }

  if (memberships.length > 1) {
    redirect("/communities");
  }

  redirect(communityPath(DEFAULT_COMMUNITY_SLUG, "ranking"));
}
