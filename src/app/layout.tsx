import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PWARegister } from "@/components/pwa-register";
import { CookieConsentProvider } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Immobilier commercial à Paris`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "Retail Avenue",
    "immobilier commercial Paris",
    "local commercial Paris",
    "boutique à louer Paris",
    "cession de bail Paris",
    "fonds de commerce Paris",
    "murs commerciaux",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Immobilier commercial à Paris`,
    description: APP_DESCRIPTION,
    images: [{ url: "/hero-paris.jpg", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Immobilier commercial à Paris`,
    description: APP_DESCRIPTION,
    images: ["/hero-paris.jpg"],
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Retail Avenue",
  },
  formatDetection: {
    telephone: true,
  },
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
