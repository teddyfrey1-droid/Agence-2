"use client";

import { useEffect, useState } from "react";
import { countQueued, flushQueue } from "@/lib/offline-queue";
import { useToast } from "@/components/ui/toast";

/**
 * Mounted once in the dashboard layout. Counts pending offline captures,
 * auto-syncs when the network comes back, and surfaces a discreet pill
 * when something is waiting.
 */
export function OfflineSync() {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    function onOnline() {
      setOnline(true);
      void trySync();
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setCount(await countQueued());
  }

  async function trySync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const n = await flushQueue();
      if (n > 0) addToast(`${n} repérage${n > 1 ? "s" : ""} synchronisé${n > 1 ? "s" : ""}`, "success");
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  if (count === 0 && online) return null;

  return (
    <button
      type="button"
      onClick={trySync}
      className={`fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-lg transition-all lg:bottom-6 ${
        online
          ? "bg-amber-500 text-white hover:bg-amber-600"
          : "bg-stone-700 text-white"
      }`}
      title="Synchroniser maintenant"
    >
      {syncing ? (
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : online ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 015.304 0m-7.425-2.122a6.75 6.75 0 019.546 0M5.106 9.288c3.808-3.804 9.98-3.804 13.788 0M12 19.5h.008v.008H12V19.5z" />
        </svg>
      )}
      {online ? `${count} en attente — synchroniser` : `Hors-ligne · ${count} en attente`}
    </button>
  );
}
