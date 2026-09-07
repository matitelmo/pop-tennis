"use client";

import { useState } from "react";
import {
  removeMemberFromCommunity,
  setMemberSubscription,
  updateMemberRating,
} from "@/lib/actions/admin/members";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { CommunityMemberProfile } from "@/lib/community/context";
import type { SubscriptionStatus } from "@/types/database";

type Props = {
  communitySlug: string;
  member: CommunityMemberProfile;
};

const SUBSCRIPTION_OPTIONS: SubscriptionStatus[] = [
  "none",
  "active",
  "comped",
  "past_due",
  "canceled",
];

export function MemberRow({ communitySlug, member }: Props) {
  const [rating, setRating] = useState(String(member.member.rating));
  const [subscription, setSubscription] = useState(member.member.subscription_status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveRating() {
    setLoading(true);
    const result = await updateMemberRating(communitySlug, member.id, Number(rating));
    setLoading(false);
    setMessage(result.success ? "Rating actualizado" : (result.error ?? "Error"));
  }

  async function saveSubscription() {
    setLoading(true);
    const result = await setMemberSubscription(communitySlug, member.id, subscription);
    setLoading(false);
    setMessage(result.success ? "Suscripción actualizada" : (result.error ?? "Error"));
  }

  async function remove() {
    if (!confirm(`¿Sacar a ${member.full_name} de la comunidad?`)) return;
    setLoading(true);
    const result = await removeMemberFromCommunity(communitySlug, member.id);
    setLoading(false);
    if (result.success) window.location.reload();
    else setMessage(result.error ?? "Error");
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{member.full_name}</p>
          <p className="text-xs text-zinc-500">{member.id.slice(0, 8)}…</p>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={loading}>
          Quitar
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-zinc-500">Rating</label>
          <Input
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="mt-1 w-24"
          />
        </div>
        <Button type="button" size="sm" onClick={saveRating} disabled={loading}>
          Guardar rating
        </Button>
        <div>
          <label className="text-xs text-zinc-500">Suscripción</label>
          <select
            value={subscription}
            onChange={(e) => setSubscription(e.target.value as SubscriptionStatus)}
            className="mt-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {SUBSCRIPTION_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={saveSubscription} disabled={loading}>
          Guardar sub
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-zinc-400">{message}</p>}
    </Card>
  );
}
