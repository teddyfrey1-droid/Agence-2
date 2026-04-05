'use client';

import { useEffect, useState } from 'react';

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, and not when already installed (standalone mode)
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPadOS 13+ reports as Mac but has touch
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;

    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 z-50 rounded-2xl shadow-2xl border border-[#D4C7B0]/20 bg-[#1E1F27] text-[#FAF8F5] p-4"
      role="dialog"
      aria-label="Installer l'application"
    >
      {/* Close button */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-[#D4C7B0]/60 hover:text-[#D4C7B0] transition-colors text-xl leading-none"
        aria-label="Fermer"
      >
        ×
      </button>

      {/* Icon + title */}
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/apple-touch-icon.png"
          alt="Retail Place"
          className="w-12 h-12 rounded-xl"
        />
        <div>
          <p className="font-semibold text-sm">Installer Retail Place</p>
          <p className="text-xs text-[#D4C7B0]/70">Accès en 1 clic depuis votre écran d'accueil</p>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-2 text-sm text-[#D4C7B0]/90">
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4C7B0]/20 text-[#D4C7B0] text-xs flex items-center justify-center font-bold">1</span>
          <span>
            Appuyez sur{' '}
            <span className="inline-flex items-center gap-1 font-medium text-[#FAF8F5]">
              {/* Share icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Partager
            </span>{' '}
            dans Safari
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4C7B0]/20 text-[#D4C7B0] text-xs flex items-center justify-center font-bold">2</span>
          <span>
            Choisissez{' '}
            <span className="font-medium text-[#FAF8F5]">« Sur l'écran d'accueil »</span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4C7B0]/20 text-[#D4C7B0] text-xs flex items-center justify-center font-bold">3</span>
          <span>Appuyez sur <span className="font-medium text-[#FAF8F5]">Ajouter</span></span>
        </li>
      </ol>
    </div>
  );
}
