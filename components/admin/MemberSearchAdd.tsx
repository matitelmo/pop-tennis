"use client";

import { useState } from "react";
import {
  addMemberToCommunity,
  searchUsersByEmail,
  type AdminUserSearchResult,
} from "@/lib/actions/admin/members";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Props = {
  communitySlug: string;
};

export function MemberSearchAdd({ communitySlug }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setMessage(null);
    const users = await searchUsersByEmail(query);
    setResults(users);
    setLoading(false);
    if (!users.length) setMessage("Sin resultados");
  }

  async function handleAdd(userId: string) {
    setLoading(true);
    const result = await addMemberToCommunity(communitySlug, userId);
    setLoading(false);
    if (result.success) {
      setMessage("Miembro agregado");
      window.location.reload();
    } else {
      setMessage(result.error ?? "Error");
    }
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-white">Agregar miembro por email</p>
      <div className="mt-3 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="email@ejemplo.com"
          className="flex-1"
        />
        <Button type="button" onClick={handleSearch} disabled={loading || query.length < 3}>
          Buscar
        </Button>
      </div>
      {message && <p className="mt-2 text-sm text-zinc-400">{message}</p>}
      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
            >
              <span className="text-zinc-300">
                {u.full_name} · {u.email}
              </span>
              <Button type="button" size="sm" onClick={() => handleAdd(u.id)} disabled={loading}>
                Agregar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
