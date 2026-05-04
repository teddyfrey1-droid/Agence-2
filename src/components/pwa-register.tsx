'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // never serve sw.js itself from HTTP cache
        });

        // Always check for a new version on load — surfaces fixes faster
        registration.update().catch(() => {});

        // If a new SW is waiting, tell it to take over immediately so the
        // user doesn't get stuck with old (possibly broken) cached responses.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // When the controller changes, reload once so the new SW serves the page
        let refreshed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshed || cancelled) return;
          refreshed = true;
          window.location.reload();
        });
      } catch {
        /* registration failed — degrade gracefully */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
