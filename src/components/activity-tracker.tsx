"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ActivityTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PAGE_VIEW", path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
