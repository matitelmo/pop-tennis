"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;
    if (!localStorage.getItem("pop-first-run-done")) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> });
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !(window.navigator as Navigator & { standalone?: boolean }).standalone) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1");
    setShow(false);
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      dismiss();
    }
  }

  return (
    <Card className="mb-4 border-accent/20 bg-accent-muted">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-white">Instalá Wild On Pop Tennis</p>
          <p className="mt-1 text-caption">
            {isIOS
              ? "Safari → Compartir → Agregar a inicio de pantalla"
              : "Accedé al ranking al toque desde tu pantalla de inicio"}
          </p>
          {!isIOS && deferredPrompt && (
            <Button type="button" onClick={install} className="mt-3" size="sm">
              Instalar app
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
