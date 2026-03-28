"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export interface PublicHeaderUser {
  firstName: string;
  lastName: string;
  role: string;
}

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/biens", label: "Nos biens" },
  { href: "/agence", label: "L'agence" },
  { href: "/recherche-local", label: "Rechercher un local" },
  { href: "/proposer-bien", label: "Proposer un bien" },
  { href: "/contact", label: "Contact" },
];

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export function PublicHeader({ user }: { user?: PublicHeaderUser | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : null;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm dark:border-stone-800 dark:bg-anthracite-900/95">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 hover:text-anthracite-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right area: CTA + Auth + Mobile toggle */}
        <div className="flex items-center gap-2.5">
          {/* CTA button - desktop */}
          <Link
            href="/recherche-local"
            className="hidden rounded-premium bg-anthracite-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-anthracite-800 lg:inline-flex"
          >
            Trouver un local
          </Link>

          {/* Auth area */}
          {user ? (
            /* --- Logged-in user dropdown --- */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-stone-200 py-1.5 pl-3 pr-1.5 text-sm transition-colors hover:bg-stone-50"
              >
                <span className="hidden text-sm font-medium text-anthracite-700 sm:inline">
                  {user.firstName}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials}
                </div>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-premium border border-stone-200 bg-white shadow-premium">
                  {/* User info */}
                  <div className="border-b border-stone-100 px-4 py-3">
                    <p className="text-sm font-semibold text-anthracite-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">{user.role}</p>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-anthracite-700 transition-colors hover:bg-stone-50"
                    >
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      Mon espace
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-stone-100 py-1.5">
                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Déconnexion
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- Not logged in --- */
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-stone-200 px-3.5 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 hover:border-stone-300"
            >
              <UserIcon className="h-4.5 w-4.5 text-stone-400" />
              <span className="hidden sm:inline">Se connecter</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-anthracite-700 hover:bg-stone-100 lg:hidden"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-100 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-anthracite-700 hover:bg-stone-50"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile auth */}
            <div className="mt-2 border-t border-stone-100 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-anthracite-800">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-stone-400">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Mon espace
                  </Link>
                  <form action="/api/auth/logout" method="POST" className="mt-1">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Déconnexion
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-anthracite-700 hover:bg-stone-50"
                >
                  <UserIcon className="h-5 w-5 text-stone-400" />
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
