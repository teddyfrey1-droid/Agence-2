import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_DESCRIPTION, SITE_URL } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PWARegister } from "@/components/pwa-register";
import { CookieConsentProvider } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase makes every canonical / Open Graph URL resolve to the single
  // authoritative domain — a core signal that retail-avenue.fr *is* the brand.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — Immobilier commercial à Paris`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "Retail Avenue",
    "Retail Avenue Paris",
    "immobilier commercial Paris",
    "local commercial Paris",
    "boutique à louer Paris",
    "bureaux Paris",
    "cession de bail",
    "fonds de commerce Paris",
    "murs commerciaux",
  ],
  authors: [{ name: APP_NAME, url: SITE_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Immobilier commercial à Paris`,
    description: APP_DESCRIPTION,
    images: ["/hero-paris.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Immobilier commercial à Paris`,
    description: APP_DESCRIPTION,
    images: ["/hero-paris.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Retail Avenue",
  },
  formatDetection: {
    telephone: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Google Search Console ownership — set GOOGLE_SITE_VERIFICATION in the env
  // to claim the property and submit the sitemap (required to influence ranking).
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
        }} />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Retail Avenue" />
      </head>
      <body className="overscroll-none">
        <ThemeProvider>
          <CookieConsentProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
            <PWARegister />
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
