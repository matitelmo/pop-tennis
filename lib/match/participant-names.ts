import { createClient } from "@/lib/supabase/server";

/** Resolve display names for profile IDs and unclaimed roster player IDs. */
export async function loadParticipantNames(
  ids: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {};

  const supabase = await createClient();
  const names: Record<string, string> = {};

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  for (const profile of profiles ?? []) {
    names[profile.id] = profile.full_name;
  }

  const missing = unique.filter((id) => !names[id]);
  if (missing.length) {
    const { data: rosterRows } = await supabase
      .from("roster_players")
      .select("id, display_name")
      .in("id", missing);

    for (const row of rosterRows ?? []) {
      names[row.id] = row.display_name;
    }
  }

  return names;
}
