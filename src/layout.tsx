import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PWARegister } from "@/components/pwa-register";
import { IOSInstallPrompt } from "@/components/ios-install-prompt";
import { CookieConsentProvider } from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Immobilier commercial à Paris`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
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
        {/* Inline theme init — prevents FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
        }} />
        {/* Google Fonts — Plus Jakarta Sans + DM Serif Display + DM Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
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
            <IOSInstallPrompt />
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
