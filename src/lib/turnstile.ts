/**
 * Cloudflare Turnstile verification (server side).
 *
 * Optional defence layered on top of honeypot + rate limit. Only active
 * when both env vars are set:
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public, rendered by the widget
 *   TURNSTILE_SECRET                — server, used here for siteverify
 *
 * When `TURNSTILE_SECRET` is missing we skip verification (dev / preview)
 * so the public flows aren't broken on first deploy. Operators must set
 * both vars in production for the gate to apply.
 *
 * Turnstile endpoint reference:
 *   https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  /** True when verification passes OR Turnstile is not configured. */
  success: boolean;
  /** Set when Turnstile is configured but the token didn't pass. */
  error?: string;
  /** True when the gate is disabled because `TURNSTILE_SECRET` is unset. */
  skipped?: boolean;
}

export const isTurnstileEnabled = !!process.env.TURNSTILE_SECRET;

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { success: true, skipped: true };

  if (!token || typeof token !== "string") {
    return { success: false, error: "missing-token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append("remoteip", remoteIp);

  // 3s timeout — Turnstile usually responds in < 200 ms; the public form
  // shouldn't hang on a slow CF edge.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!res.ok) {
      return { success: false, error: `siteverify-${res.status}` };
    }
    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!json.success) {
      return {
        success: false,
        error: (json["error-codes"] || []).join(",") || "verification-failed",
      };
    }
    return { success: true };
  } catch (err) {
    console.error("[turnstile] verify failed", err);
    return { success: false, error: "network-error" };
  } finally {
    clearTimeout(timer);
  }
}
