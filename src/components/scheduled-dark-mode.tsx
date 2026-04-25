"use client";

import { useEffect } from "react";

const KEY = "theme-schedule-v1";

export interface DarkSchedule {
  enabled: boolean;
  /** "HH:mm" — start of the dark window */
  darkFrom: string;
  /** "HH:mm" — end of the dark window */
  darkUntil: string;
}

export const DEFAULT_SCHEDULE: DarkSchedule = {
  enabled: false,
  darkFrom: "20:00",
  darkUntil: "07:00",
};

export function getSchedule(): DarkSchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    return { ...DEFAULT_SCHEDULE, ...(JSON.parse(raw) as Partial<DarkSchedule>) };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function saveSchedule(s: DarkSchedule) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("retail:dark-schedule"));
}

function parseHM(value: string): { h: number; m: number } | null {
  const m = value.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function shouldBeDark(now: Date, schedule: DarkSchedule): boolean {
  const from = parseHM(schedule.darkFrom);
  const until = parseHM(schedule.darkUntil);
  if (!from || !until) return false;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const minutesFrom = from.h * 60 + from.m;
  const minutesUntil = until.h * 60 + until.m;
  if (minutesFrom === minutesUntil) return false;
  if (minutesFrom < minutesUntil) {
    return minutesNow >= minutesFrom && minutesNow < minutesUntil;
  }
  // Window crosses midnight (e.g. 20:00 → 07:00)
  return minutesNow >= minutesFrom || minutesNow < minutesUntil;
}

/**
 * When the user has opted into a dark-mode schedule (in /dashboard/parametres),
 * this component takes over the `.dark` class on `<html>` and toggles it
 * every minute as the clock crosses the boundary. While the schedule is
 * disabled, it does nothing — the regular theme provider stays in charge.
 */
export function ScheduledDarkMode() {
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    function apply() {
      if (cancelled) return;
      const schedule = getSchedule();
      if (!schedule.enabled) return;
      const dark = shouldBeDark(new Date(), schedule);
      document.documentElement.classList.toggle("dark", dark);
    }

    function start() {
      apply();
      // Run a check every 30 s — fine-grained enough that the user notices the
      // switch the moment the boundary is crossed without burning cycles.
      interval = setInterval(apply, 30_000);
    }

    function stop() {
      if (interval) clearInterval(interval);
      interval = null;
    }

    function onScheduleChange() {
      stop();
      start();
    }

    start();
    window.addEventListener("retail:dark-schedule", onScheduleChange);
    return () => {
      cancelled = true;
      stop();
      window.removeEventListener("retail:dark-schedule", onScheduleChange);
    };
  }, []);

  return null;
}
