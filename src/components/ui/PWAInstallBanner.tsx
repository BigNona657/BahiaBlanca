"use client";

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

// Detecta iOS (Safari no dispara beforeinstallprompt, necesita guía manual)
function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream);
  }, []);
  return isIOS;
}

function useIsStandalone() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  return standalone;
}

export default function PWAInstallBanner() {
  const { canInstall, triggerInstall } = usePWAInstall();
  const isIOS = useIsIOS();
  const isStandalone = useIsStandalone();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Leer si ya fue descartado en esta sesión
  useEffect(() => {
    setDismissed(sessionStorage.getItem("pwa_banner_dismissed") === "1");
  }, []);

  function dismiss() {
    sessionStorage.setItem("pwa_banner_dismissed", "1");
    setDismissed(true);
    setShowIOSGuide(false);
  }

  async function handleInstall() {
    const outcome = await triggerInstall();
    if (outcome === "accepted") dismiss();
  }

  // No mostrar si: ya instalada, ya descartada, ni Android ni iOS
  if (isStandalone || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      {/* ── Banner principal ── */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
          {/* Ícono */}
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-2xl shrink-0">
            🍽️
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">Instalá BigNona</p>
            <p className="text-xs text-gray-400 leading-tight">
              Acceso rápido desde tu pantalla de inicio
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {canInstall ? (
              <button
                onClick={handleInstall}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Instalar
              </button>
            ) : (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Cómo instalar
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 text-center transition"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal guía iOS ── */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
          onClick={dismiss}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Instalá BigNona en iOS</h3>
              <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ✕
              </button>
            </div>

            <ol className="space-y-3">
              {[
                { icon: "⬆️", text: 'Tocá el botón "Compartir" en la barra de Safari' },
                { icon: "➕", text: 'Deslizá y tocá "Agregar a pantalla de inicio"' },
                { icon: "✅", text: 'Tocá "Agregar" para confirmar' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{step.icon}</span>
                  <p className="text-sm text-gray-600 pt-0.5">{step.text}</p>
                </li>
              ))}
            </ol>

            <button
              onClick={dismiss}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
