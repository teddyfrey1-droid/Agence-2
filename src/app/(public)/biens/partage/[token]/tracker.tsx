"use client";

import { useEffect, useRef } from "react";

export function ShareViewTracker({ token }: { token: string }) {
  const startedAt = useRef<number>(Date.now());
  const flushed = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    flushed.current = false;
    // Ping open (backend also increments on page render; this is a belt-and-suspenders)
    fetch(`/api/property-shares/${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open" }),
      keepalive: true,
    }).catch(() => {});

    const flush = () => {
      if (flushed.current) return;
      flushed.current = true;
      const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      fetch(`/api/property-shares/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duration", duration }),
        keepalive: true,
      }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token]);

  return null;
}
