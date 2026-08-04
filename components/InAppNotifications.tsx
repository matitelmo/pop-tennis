"use client";

import { useEffect, useState } from "react";
import type { InAppNotification } from "@/lib/notifications/in-app";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pop_dismissed_notifications";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function dismiss(id: string) {
  const dismissed = getDismissed();
  dismissed.add(id);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissed)));
}

function shouldShowNotifications(): boolean {
  const visits = parseInt(localStorage.getItem("pop-visit-count") ?? "0", 10) + 1;
  localStorage.setItem("pop-visit-count", String(visits));
  return visits >= 2;
}

type Props = {
  notifications: InAppNotification[];
};

export function InAppNotifications({ notifications }: Props) {
  const [visible, setVisible] = useState<InAppNotification[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!shouldShowNotifications()) return;
    setEnabled(true);
    const dismissed = getDismissed();
    setVisible(notifications.filter((n) => !dismissed.has(n.id)));
  }, [notifications]);

  if (!enabled || visible.length === 0) return null;

  const current = visible[0];

  function handleDismiss() {
    dismiss(current.id);
    setVisible((prev) => prev.slice(1));
  }

  const styles = {
    upset: "border-accent/40 bg-accent-muted",
    rank_pass: "border-warning/40 bg-warning/10",
    inactivity: "border-danger/40 bg-danger/10",
  };

  return (
    <div className="mb-4 rounded-2xl border border-border-subtle p-4 shadow-lg backdrop-blur-sm">
      <div className={cn("rounded-xl border px-4 py-3", styles[current.type])}>
        <p className="text-sm font-medium text-white">{current.message}</p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-3 min-h-[40px] w-full rounded-xl bg-surface-glass text-sm font-bold text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Entendido
        </button>
      </div>
      {visible.length > 1 && (
        <p className="mt-2 text-center text-caption">+{visible.length - 1} más</p>
      )}
    </div>
  );
}

export function TercerTiempoModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-slide-up-in rounded-3xl border border-accent/30 bg-surface p-6 shadow-2xl">
        <p className="text-center text-lg font-bold text-white">Tercer tiempo</p>
        <p className="mt-2 text-center text-body">
          Terminó el partido. ¿Salen unas pupusas / burgas de festejo?
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 min-h-[48px] w-full rounded-xl bg-accent font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Obvio
        </button>
      </div>
    </div>
  );
}
