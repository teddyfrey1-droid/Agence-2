"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE_NAME = "ra_cookie_consent";
const CONSENT_VERSION = 1;
// 6 months in seconds, matching CNIL recommendation
const CONSENT_MAX_AGE = 60 * 60 * 24 * 183;

export type CookieCategories = {
  necessary: true; // always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

type StoredConsent = {
  version: number;
  date: string;
  categories: CookieCategories;
};

type CookieConsentContextValue = {
  consent: CookieCategories | null;
  hasChoice: boolean;
  openPreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Omit<CookieCategories, "necessary">) => void;
};

const DEFAULT_CATEGORIES: CookieCategories = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

function readStoredConsent(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(CONSENT_COOKIE_NAME + "="));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split("=")[1] ?? "");
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredConsent(categories: CookieCategories) {
  if (typeof document === "undefined") return;
  const payload: StoredConsent = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    categories,
  };
  const value = encodeURIComponent(JSON.stringify(payload));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    CONSENT_COOKIE_NAME +
    "=" +
    value +
    "; Path=/; Max-Age=" +
    CONSENT_MAX_AGE +
    "; SameSite=Lax" +
    secure;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieCategories | null>(null);
  const [hasChoice, setHasChoice] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored.categories);
      setHasChoice(true);
    } else {
      setBannerOpen(true);
    }
  }, []);

  const applyConsent = useCallback((categories: CookieCategories) => {
    writeStoredConsent(categories);
    setConsent(categories);
    setHasChoice(true);
    setBannerOpen(false);
    setModalOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-change", { detail: categories })
      );
    }
  }, []);

  const acceptAll = useCallback(() => {
    applyConsent({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
  }, [applyConsent]);

  const rejectAll = useCallback(() => {
    applyConsent({ ...DEFAULT_CATEGORIES });
  }, [applyConsent]);

  const savePreferences = useCallback(
    (prefs: Omit<CookieCategories, "necessary">) => {
      applyConsent({ necessary: true, ...prefs });
    },
    [applyConsent]
  );

  const openPreferences = useCallback(() => {
    setModalOpen(true);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasChoice,
      openPreferences,
      acceptAll,
      rejectAll,
      savePreferences,
    }),
    [consent, hasChoice, openPreferences, acceptAll, rejectAll, savePreferences]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {mounted && bannerOpen && !modalOpen && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={() => setModalOpen(true)}
        />
      )}
      {mounted && modalOpen && (
        <CookiePreferencesModal
          initial={consent ?? DEFAULT_CATEGORIES}
          onClose={() => {
            setModalOpen(false);
            if (!hasChoice) setBannerOpen(true);
          }}
          onSave={(prefs) => savePreferences(prefs)}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
        />
      )}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider"
    );
  }
  return ctx;
}

function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[100] animate-slide-up px-4 pb-safe-or-4 sm:px-6"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-700 dark:bg-anthracite-900 sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <div className="flex-1">
            <h2 className="font-serif text-lg font-semibold text-anthracite-900 dark:text-stone-100 sm:text-xl">
              Respect de votre vie privée
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-anthracite-600 dark:text-stone-300">
              Nous utilisons des cookies pour assurer le bon fonctionnement du
              site, mesurer son audience et améliorer votre expérience. Vous
              pouvez accepter, refuser ou personnaliser vos choix à tout moment.
              Pour en savoir plus, consultez notre{" "}
              <Link
                href="/politique-cookies"
                className="font-medium text-brand-600 underline hover:text-brand-700"
              >
                politique cookies
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 md:min-w-[220px]">
            <Button onClick={onAcceptAll} variant="primary">
              Tout accepter
            </Button>
            <Button onClick={onRejectAll} variant="outline">
              Tout refuser
            </Button>
            <Button onClick={onCustomize} variant="ghost">
              Personnaliser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CookiePreferencesModal({
  initial,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  initial: CookieCategories;
  onClose: () => void;
  onSave: (prefs: Omit<CookieCategories, "necessary">) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [functional, setFunctional] = useState(initial.functional);
  const [marketing, setMarketing] = useState(initial.marketing);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Préférences cookies"
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-anthracite-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-anthracite-900 sm:max-w-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5 dark:border-stone-700">
          <div>
            <h2 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
              Préférences cookies
            </h2>
            <p className="mt-1 text-sm text-anthracite-500 dark:text-stone-400">
              Choisissez les catégories de cookies que vous souhaitez autoriser.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-anthracite-800 dark:hover:bg-anthracite-800 dark:hover:text-stone-100"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <CategoryRow
            title="Strictement nécessaires"
            description="Indispensables au fonctionnement du site (session, sécurité, mémorisation de vos préférences cookies). Ils ne peuvent pas être désactivés."
            checked
            disabled
          />
          <CategoryRow
            title="Mesure d'audience"
            description="Statistiques anonymisées sur la fréquentation du site afin d'en améliorer le contenu et l'ergonomie."
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            title="Fonctionnels"
            description="Mémorisation de vos préférences (recherches récentes, critères sauvegardés) pour une navigation plus fluide."
            checked={functional}
            onChange={setFunctional}
          />
          <CategoryRow
            title="Marketing"
            description="Permettent de mesurer l'efficacité de nos campagnes et, le cas échéant, de proposer du contenu adapté à vos centres d'intérêt."
            checked={marketing}
            onChange={setMarketing}
          />

          <p className="pt-2 text-xs text-anthracite-500 dark:text-stone-400">
            En savoir plus&nbsp;:{" "}
            <Link
              href="/politique-cookies"
              className="text-brand-600 underline hover:text-brand-700"
            >
              politique cookies
            </Link>{" "}
            —{" "}
            <Link
              href="/politique-confidentialite"
              className="text-brand-600 underline hover:text-brand-700"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <footer className="flex flex-col gap-2 border-t border-stone-200 px-6 py-4 pb-safe-or-4 dark:border-stone-700 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onRejectAll}>
            Tout refuser
          </Button>
          <Button
            variant="outline"
            onClick={() => onSave({ analytics, functional, marketing })}
          >
            Enregistrer mes choix
          </Button>
          <Button variant="primary" onClick={onAcceptAll}>
            Tout accepter
          </Button>
        </footer>
      </div>
    </div>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-anthracite-900/40">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-anthracite-600 dark:text-stone-400">
          {description}
        </p>
      </div>
      <label
        className={
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center " +
          (disabled ? "cursor-not-allowed opacity-60" : "")
        }
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-stone-300 transition-colors peer-checked:bg-brand-500 dark:bg-stone-600" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
