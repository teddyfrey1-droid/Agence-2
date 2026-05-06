"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget — invisible-managed mode.
 *
 * Renders nothing if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set so dev
 * works without the gate. When configured, the operator should also set
 * `TURNSTILE_SECRET` server-side (see `src/lib/turnstile.ts`).
 *
 * The token is delivered to the parent through `onVerify`. A hidden
 * input named `cf-turnstile-response` is also rendered so plain
 * `<form>` submissions pick it up automatically.
 */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: (error: unknown) => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "compact" | "flexible" | "invisible";
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  className?: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  onVerify,
  onExpire,
  theme = "auto",
  size = "flexible",
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (!SITE_KEY || !scriptLoaded || !containerRef.current) return;
    const t = window.turnstile;
    if (!t) return;

    // If a previous instance exists (HMR), tear it down first.
    if (widgetIdRef.current) {
      try {
        t.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null;
    }

    widgetIdRef.current = t.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme,
      size,
      callback: (tk) => {
        setToken(tk);
        onVerify?.(tk);
      },
      "expired-callback": () => {
        setToken("");
        onExpire?.();
      },
      "error-callback": () => {
        setToken("");
      },
    });

    return () => {
      const tt = window.turnstile;
      if (tt && widgetIdRef.current) {
        try {
          tt.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, theme, size, onVerify, onExpire]);

  // Hide the widget entirely when not configured — dev/preview without keys.
  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} aria-label="Vérification anti-bot" />
      {/* Hidden field so plain <form> submissions pick the token up too. */}
      <input
        type="hidden"
        id={inputId}
        name="cf-turnstile-response"
        value={token}
        readOnly
      />
    </div>
  );
}
