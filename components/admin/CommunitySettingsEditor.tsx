"use client";

import { useState } from "react";
import {
  updateCommunityName,
  updateCommunitySettings,
} from "@/lib/actions/admin/community";
import { CommunitySettingsForm } from "@/components/admin/CommunitySettingsForm";
import { Card } from "@/components/ui/Card";
import type { CommunitySettings } from "@/lib/community/settings";

type Props = {
  slug: string;
  name: string;
  settings: CommunitySettings;
};

export function CommunitySettingsEditor({ slug, name: initialName, settings }: Props) {
  const [name, setName] = useState(initialName);

  async function handleSubmit(nextSettings: CommunitySettings) {
    if (name.trim() !== initialName) {
      const nameResult = await updateCommunityName(slug, name);
      if (!nameResult.success) return nameResult;
    }
    return updateCommunitySettings(slug, nextSettings);
  }

  return (
    <Card className="p-5">
      <CommunitySettingsForm
        initial={settings}
        onSubmit={handleSubmit}
        showName={{ value: name, onChange: setName }}
      />
    </Card>
  );
}
