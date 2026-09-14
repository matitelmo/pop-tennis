"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { updatePhoneNumber } from "@/lib/actions/profile";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type Props = {
  initial: string | null;
  canEdit: boolean;
  communitySlug?: string;
};

export function PhoneNumberSection({ initial, canEdit, communitySlug: slugProp }: Props) {
  const { slug, translate: tr } = useCommunity();
  const communitySlug = slugProp ?? slug;
  const [phone, setPhone] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await updatePhoneNumber(communitySlug, phone);
    setSaving(false);
    if (result.success) setSaved(true);
    else setError(result.error ?? "Error");
  }

  if (!canEdit) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Phone className="h-5 w-5 text-accent" />
        <h3 className="font-bold text-white">{tr("phoneNumber")}</h3>
      </div>
      <p className="mt-1 text-caption">{tr("phoneHint")}</p>
      <div className="mt-4">
        <Label htmlFor="phone">{tr("phoneNumber")}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          placeholder={tr("phonePlaceholder")}
          autoComplete="tel"
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <Button type="button" className="mt-4 w-full" size="sm" disabled={saving} onClick={save}>
        {saving ? tr("saving") : saved ? tr("saved") : tr("savePhone")}
      </Button>
    </Card>
  );
}
