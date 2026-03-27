"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/espace-client", label: "Accueil" },
  { href: "/espace-client/biens", label: "Biens disponibles" },
  { href: "/espace-client/recherche", label: "Ma recherche" },
  { href: "/espace-client/matches", label: "Mes matches" },
];

export function ClientNavbar({
  user,
}: {
  user: { firstName: string; lastName: string };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  function isActive(href: string) {
    if (href === "/espace-client") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-sm dark:border-stone-700/50 dark:bg-anthracite-900/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-8">
          <Logo size="sm" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-stone-600 hover:bg-stone-100 hover:text-anthracite-800 dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Theme + Avatar + Logout + Mobile hamburger */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {initials}
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                Deconnexion
              </Button>
            </form>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:bg-stone-100 md:hidden dark:border-stone-700 dark:text-stone-400 dark:hover:bg-anthracite-800"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 pt-2 md:hidden dark:border-stone-700/50 dark:bg-anthracite-900">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-anthracite-800"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-700/50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {initials}
              </div>
              <span className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                Deconnexion
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
