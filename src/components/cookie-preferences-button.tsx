"use client";

import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent";

export function CookiePreferencesButton() {
  const { openPreferences } = useCookieConsent();
  return (
    <Button variant="outline" onClick={openPreferences}>
      Gérer mes préférences cookies
    </Button>
  );
}
