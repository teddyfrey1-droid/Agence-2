"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";

const THRESHOLD = 72;
const MAX_PULL = 120;

/**
 * Wrap any dashboard page content with this to enable native-feeling
 * pull-to-refresh on mobile. Desktops / pointer devices are no-ops.
 *
 * Triggers `router.refresh()` when released past the threshold, so Next.js
 * re-runs the server component and swaps in fresh data without a full reload.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const triggeredHapticRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Only on coarse pointers (touch) — avoid accidental desktop triggers.
    const isTouch = typeof window !== "undefined"
      && window.matchMedia("(pointer: coarse)").matches;
    if (!isTouch) return;

    function onTouchStart(e: TouchEvent) {
      // Only trigger when scrolled to the very top
      if (window.scrollY > 2) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      triggeredHapticRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current == null || refreshing) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      // Rubber-band easing
      const eased = Math.min(MAX_PULL, delta * 0.5);
      setPull(eased);
      if (eased > THRESHOLD && !triggeredHapticRef.current) {
        haptic("select");
        triggeredHapticRef.current = true;
      }
    }

    function onTouchEnd() {
      if (startYRef.current == null) return;
      startYRef.current = null;
      if (pull > THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        haptic("success");
        // router.refresh() is synchronous from our side but actually runs the
        // RSC request; keep the indicator visible for a short beat.
        router.refresh();
        window.setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 700);
      } else {
        setPull(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pull, refreshing, router]);

  const armed = pull > THRESHOLD || refreshing;

  return (
    <>
      <div
        aria-hidden={pull === 0}
        className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex justify-center lg:hidden"
        style={{
          transform: `translateY(${Math.max(0, pull - 24)}px)`,
          opacity: pull > 8 ? 1 : 0,
          transition: startYRef.current == null ? "transform 180ms ease, opacity 180ms ease" : "none",
        }}
      >
        <div
          className={`mt-2 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-lg transition-colors dark:bg-anthracite-900 ${
            armed
              ? "border-brand-300 text-brand-600 dark:border-brand-600 dark:text-brand-400"
              : "border-stone-200 text-stone-400 dark:border-stone-700 dark:text-stone-500"
          }`}
        >
          {refreshing ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 transition-transform"
              style={{ transform: `rotate(${Math.min(360, (pull / THRESHOLD) * 360)}deg)` }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0113.793-4.207l1.457-1.457M19.5 12a7.5 7.5 0 01-13.793 4.207L4.25 17.664M19.5 3v4.5h-4.5M4.25 21v-4.5h4.5" />
            </svg>
          )}
        </div>
      </div>
      {children}
    </>
  );
}
