"use client";

import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export function Sheet({ open, onClose, children, title }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md animate-slide-up-in rounded-3xl border border-accent/30 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-shimmer rounded-xl bg-surface-glass", className)}
      aria-hidden
    />
  );
}
