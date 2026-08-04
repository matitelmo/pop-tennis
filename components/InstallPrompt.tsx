"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;

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
      setShow(true);
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
    <div className="mb-4 rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-white">Instalá Pop Tennis</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isIOS
              ? "Safari → Compartir → Agregar a inicio de pantalla"
              : "Accedé al ranking al toque desde tu pantalla de inicio"}
          </p>
          {!isIOS && deferredPrompt && (
            <button
              type="button"
              onClick={install}
              className="mt-3 min-h-[44px] rounded-xl bg-lime-500 px-4 text-sm font-bold text-black active:scale-[0.98]"
            >
              Instalar app
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-500"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
