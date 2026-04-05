'use client';

import { useEffect, useState } from 'react';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotifications() {
  const [state, setState] = useState<PermissionState>('idle');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only run in browser with service worker and Push API support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const current = Notification.permission;
    if (current === 'granted') {
      // Already granted — silently subscribe if not yet done
      subscribeIfNeeded();
      return;
    }

    if (current === 'denied') {
      return;
    }

    // Show prompt if permission not yet requested (dismiss is session-scoped)
    const dismissed = sessionStorage.getItem('push-prompt-dismissed');
    if (!dismissed) {
      // Small delay to avoid showing immediately on first load
      const timer = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subscribeIfNeeded() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return; // already subscribed

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch {
      // Silently ignore errors (e.g. network offline)
    }
  }

  async function handleEnable() {
    setState('requesting');
    setShow(false);

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setState('granted');
      await subscribeIfNeeded();
    } else {
      setState('denied');
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('push-prompt-dismissed', '1');
    setShow(false);
  }

  if (!show || state !== 'idle') return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 z-50 rounded-2xl shadow-2xl border border-[#D4C7B0]/20 bg-[#1E1F27] text-[#FAF8F5] p-4 max-w-sm mx-auto"
      role="dialog"
      aria-label="Activer les notifications"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#D4C7B0]/60 hover:text-[#D4C7B0] transition-colors text-xl leading-none"
        aria-label="Fermer"
      >
        ×
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#D4C7B0]/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4C7B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm">Activer les notifications</p>
          <p className="text-xs text-[#D4C7B0]/70 mt-0.5">
            Recevez une alerte pour les nouveaux matchs, dossiers et tâches
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="flex-1 py-2 px-3 rounded-xl bg-[#D4C7B0] text-[#1E1F27] text-sm font-semibold hover:bg-[#c9bba3] transition-colors"
        >
          Activer
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 py-2 px-3 rounded-xl bg-[#D4C7B0]/10 text-[#D4C7B0] text-sm hover:bg-[#D4C7B0]/20 transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
