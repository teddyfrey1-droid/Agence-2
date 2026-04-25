"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/toast";

type Action = "archive" | "claim";

interface Props {
  id: string;
  href: string;
  children: React.ReactNode;
  /** Disable swipe for already-archived items */
  disabled?: boolean;
}

const THRESHOLD = 90;
const MAX = 140;

/**
 * Swipeable demande card:
 *  - Swipe LEFT → archive (set status = ARCHIVEE)
 *  - Swipe RIGHT → claim for myself (set assignedToId to current user)
 *
 * Touch-only; clicks still navigate via the inner <Link>.
 */
export function DemandeSwipeCard({ id, href, children, disabled }: Props) {
  const [dx, setDx] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [locked, setLocked] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const axisRef = useRef<"h" | "v" | null>(null);
  const triggeredHapticRef = useRef(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.userId && setMeId(d.userId))
      .catch(() => {});
  }, []);

  function onStart(e: React.TouchEvent) {
    if (disabled || locked) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    axisRef.current = null;
    triggeredHapticRef.current = false;
  }

  function onMove(e: React.TouchEvent) {
    if (disabled || locked || startXRef.current == null || startYRef.current == null) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    const deltaY = e.touches[0].clientY - startYRef.current;
    // Lock to one axis after a small movement so vertical scroll still works.
    if (axisRef.current == null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      axisRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
    }
    if (axisRef.current !== "h") return;
    const clamped = Math.max(-MAX, Math.min(MAX, deltaX));
    setDx(clamped);
    const nextAction: Action | null =
      clamped > THRESHOLD ? "claim" : clamped < -THRESHOLD ? "archive" : null;
    if (nextAction && nextAction !== action) {
      setAction(nextAction);
      if (!triggeredHapticRef.current) {
        haptic("select");
        triggeredHapticRef.current = true;
      }
    } else if (!nextAction && action) {
      setAction(null);
    }
  }

  async function commit(kind: Action) {
    setLocked(true);
    haptic("success");
    try {
      if (kind === "archive") {
        const res = await fetch(`/api/search-requests/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVEE" }),
        });
        if (!res.ok) throw new Error("Échec archivage");
        addToast("Demande archivée", "info");
      } else {
        if (!meId) throw new Error("Session introuvable");
        const res = await fetch(`/api/search-requests/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: meId }),
        });
        if (!res.ok) throw new Error("Échec attribution");
        addToast("Demande attribuée", "success");
      }
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur", "error");
      setDx(0);
      setAction(null);
      setLocked(false);
    }
  }

  function onEnd() {
    if (disabled || locked) return;
    startXRef.current = null;
    startYRef.current = null;
    axisRef.current = null;
    if (action) {
      // Slide out in the direction of the action, then commit
      setDx(action === "claim" ? window.innerWidth : -window.innerWidth);
      setTimeout(() => commit(action), 150);
    } else {
      setDx(0);
    }
  }

  const isArchive = action === "archive";
  const isClaim = action === "claim";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left reveal (claim) */}
      <div
        className={`absolute inset-y-0 left-0 flex items-center gap-2 px-5 text-white transition-colors ${
          isClaim ? "bg-emerald-600" : "bg-emerald-500/80"
        }`}
        style={{ width: Math.max(0, dx) }}
        aria-hidden
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        {dx > 60 && <span className="text-xs font-semibold whitespace-nowrap">Pour moi</span>}
      </div>

      {/* Right reveal (archive) */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end gap-2 px-5 text-white transition-colors ${
          isArchive ? "bg-red-600" : "bg-red-500/80"
        }`}
        style={{ width: Math.max(0, -dx) }}
        aria-hidden
      >
        {dx < -60 && <span className="text-xs font-semibold whitespace-nowrap">Archiver</span>}
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>

      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        className="relative"
        style={{
          transform: `translateX(${dx}px)`,
          transition: startXRef.current == null ? "transform 180ms ease" : "none",
        }}
      >
        <Link href={href} className="block">
          {children}
        </Link>
      </div>
    </div>
  );
}
