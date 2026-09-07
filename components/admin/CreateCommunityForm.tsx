"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCommunity } from "@/lib/actions/admin/community";
import { slugFromName } from "@/lib/community/slug-format";
import { DEFAULT_COMMUNITY_SETTINGS } from "@/lib/community/settings";
import { CommunitySettingsForm } from "@/components/admin/CommunitySettingsForm";
import { Card } from "@/components/ui/Card";

export function CreateCommunityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugFromName(value));
  }

  async function handleCreate(settings: typeof DEFAULT_COMMUNITY_SETTINGS) {
    setError(null);
    const result = await createCommunity({ name, slug, settings });
    if (result.success) {
      router.push(`/admin/communities/${slug}`);
      router.refresh();
      return { success: true };
    }
    setError(result.error ?? "Error");
    return result;
  }

  return (
    <Card className="p-5">
      <div className="mb-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-400">Slug (URL)</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            placeholder="mi-liga"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <CommunitySettingsForm
        initial={DEFAULT_COMMUNITY_SETTINGS}
        onSubmit={handleCreate}
        showName={{ value: name, onChange: handleNameChange }}
      />
    </Card>
  );
}
