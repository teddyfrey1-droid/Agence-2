"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/biens", label: "Nos biens" },
  { href: "/agence", label: "L'agence" },
  { href: "/recherche-local", label: "Rechercher un local" },
  { href: "/proposer-bien", label: "Proposer un bien" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-anthracite-900">
            <span className="text-lg font-bold text-champagne-300">A</span>
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-anthracite-900">
              {APP_NAME}
            </p>
            <p className="text-[11px] tracking-wider text-stone-400 uppercase">
              Immobilier commercial
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
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

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/recherche-local"
            className="hidden rounded-premium bg-anthracite-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-anthracite-800 sm:inline-flex"
          >
            Trouver un local
          </Link>

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
          </div>
        </div>
      )}
    </header>
  );
}
