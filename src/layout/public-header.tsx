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
  { href: "/biens",          label: "Biens" },
  { href: "/agence",         label: "Services" },
  { href: "/recherche-local",label: "Expertise" },
  { href: "/contact",        label: "Contact" },
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
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* ── Scroll-aware header ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close user dropdown on outside click ── */
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
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-white/97 backdrop-blur-md border-b border-stone-100 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:bg-anthracite-900/97 dark:border-stone-800"
          : "bg-white/80 backdrop-blur-sm border-b border-stone-100/50 dark:bg-anthracite-900/80 dark:border-stone-800/50",
      )}
    >
      {/* ── Top strip — ultra-thin luxury identity line ── */}
      <div className="hidden lg:block border-b border-stone-100/70 dark:border-stone-800/70">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex items-center justify-between py-2">
            <p className="font-sans text-[9px] tracking-[0.45em] uppercase text-stone-400 dark:text-stone-500">
              Paris &amp; Île-de-France &nbsp;·&nbsp; Immobilier d&apos;exception
            </p>
            <div className="flex items-center gap-6">
              {user ? (
                <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-stone-400 dark:text-stone-500">
                  Espace client
                </span>
              ) : (
                <Link
                  href="/login"
                  className="font-sans text-[9px] tracking-[0.3em] uppercase text-stone-400 hover:text-anthracite-700 transition-colors dark:text-stone-500 dark:hover:text-stone-300"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 lg:py-5">

          {/* Logo */}
          <Logo size="md" />

          {/* Desktop nav — centred links */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-luxury"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right action area */}
          <div className="flex items-center gap-4">

            {/* Primary CTA — desktop only */}
            <Link
              href="/recherche-local"
              className={cn(
                "hidden lg:inline-flex items-center gap-2",
                "border border-anthracite-900 px-6 py-2.5",
                "font-sans text-[10px] tracking-[0.25em] uppercase text-anthracite-900",
                "transition-all duration-300",
                "hover:bg-anthracite-900 hover:text-white",
                "dark:border-stone-400 dark:text-stone-300 dark:hover:bg-stone-100/10 dark:hover:text-white",
              )}
            >
              Rechercher un bien
            </Link>

            {/* Authenticated user menu */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-stone-200 py-1.5 pl-3 pr-1.5 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-anthracite-800"
                >
                  <span className="hidden font-sans text-[11px] tracking-wide text-anthracite-700 sm:inline dark:text-stone-300">
                    {user.firstName}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 font-sans text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {initials}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden border border-stone-100 bg-white shadow-premium dark:border-stone-800 dark:bg-anthracite-900">
                    <div className="border-b border-stone-100 px-5 py-4 dark:border-stone-800">
                      <p className="font-sans text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-stone-400 tracking-wide">{user.role}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 font-sans text-sm text-anthracite-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-anthracite-800"
                      >
                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        Mon espace
                      </Link>
                    </div>
                    <div className="border-t border-stone-100 py-2 dark:border-stone-800">
                      <form action="/api/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="flex w-full items-center gap-3 px-5 py-3 font-sans text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
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
              /* Guest — minimal icon link on mobile, hidden on desktop (top strip handles it) */
              <Link
                href="/login"
                className="flex items-center gap-1.5 lg:hidden text-stone-500 hover:text-anthracite-900 transition-colors dark:text-stone-400 dark:hover:text-stone-100"
                aria-label="Se connecter"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded p-1.5 text-anthracite-700 hover:bg-stone-100 lg:hidden dark:text-stone-300 dark:hover:bg-anthracite-800"
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-100 bg-white px-6 pb-6 pt-4 lg:hidden dark:border-stone-800 dark:bg-anthracite-900">
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 font-sans text-xs tracking-[0.2em] uppercase text-stone-500 hover:text-anthracite-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <Link
                href="/recherche-local"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center border border-anthracite-900 px-6 py-3 font-sans text-[10px] tracking-[0.25em] uppercase text-anthracite-900 dark:border-stone-400 dark:text-stone-300"
              >
                Rechercher un bien
              </Link>
            </div>

            {/* Mobile auth */}
            <div className="mt-3 border-t border-stone-100 pt-4 dark:border-stone-800">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-sans text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                      {initials}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-anthracite-800 dark:text-stone-200">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="font-sans text-xs text-stone-400">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 px-3 py-2.5 font-sans text-xs tracking-wide text-brand-700 hover:bg-brand-50 dark:text-brand-400"
                  >
                    Mon espace
                  </Link>
                  <form action="/api/auth/logout" method="POST" className="mt-1">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-3 py-2.5 font-sans text-xs text-red-500 hover:bg-red-50"
                    >
                      Déconnexion
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 font-sans text-xs tracking-[0.2em] uppercase text-stone-500 hover:text-anthracite-900"
                >
                  <UserIcon className="h-4 w-4" />
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
