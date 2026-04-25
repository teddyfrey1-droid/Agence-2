/**
 * Lightweight haptic feedback helper.
 *
 * Uses `navigator.vibrate` when available (Android / Chrome on desktop with
 * a phone paired, PWAs installed on mobile). iOS Safari does not expose the
 * Vibration API, so this gracefully does nothing there — use CSS-based
 * micro-animations for iOS feedback instead.
 *
 * Patterns are short by design so the UI stays snappy and never feels like a
 * buzzer — long vibrations are annoying.
 */
export type HapticKind =
  | "tap"      // generic click / press confirmation
  | "success"  // save / create / confetti moment
  | "warning"  // destructive confirmation, undo
  | "error"    // failure / permission denied
  | "select";  // navigating between options, swipe snap

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 10,
  select: 8,
  success: [12, 40, 18],
  warning: [20, 60, 20],
  error: [40, 80, 40],
};

export function haptic(kind: HapticKind = "tap") {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when the page isn't in the foreground — ignore.
  }
}
