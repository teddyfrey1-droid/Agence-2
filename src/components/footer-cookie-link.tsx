"use client";

import { useCookieConsent } from "@/components/cookie-consent";

export function FooterCookieLink() {
  const { openPreferences } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="transition-colors hover:text-stone-300"
    >
      Gérer les cookies
    </button>
  );
}
