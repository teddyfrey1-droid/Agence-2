"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Accueil", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Biens", href: "/dashboard/biens", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { name: "Demandes", href: "/dashboard/demandes", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { name: "Contacts", href: "/dashboard/contacts", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { name: "Terrain", href: "/dashboard/terrain", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
  { name: "Dossiers", href: "/dashboard/dossiers", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  { name: "Carte", href: "/dashboard/carte", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { name: "Pipeline", href: "/dashboard/dossiers/pipeline", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
  { name: "Calendrier", href: "/dashboard/calendrier", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  { name: "Tâches", href: "/dashboard/taches", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { name: "Interactions", href: "/dashboard/interactions", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { name: "Performance", href: "/dashboard/performance", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { name: "Marché", href: "/dashboard/marche", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
  { name: "Admin", href: "/dashboard/admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger button - shown in header area on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-anthracite-800 dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
        aria-label="Ouvrir le menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Sidebar panel */}
          <aside className="absolute inset-y-0 left-0 z-[61] flex w-72 flex-col bg-white shadow-2xl dark:bg-anthracite-900" style={{ position: "absolute", top: 0, bottom: 0, left: 0 }}>
            {/* Header with close */}
            <div className="flex h-16 items-center justify-between border-b border-stone-100 px-4 dark:border-stone-700/50">
              <Logo size="sm" />
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-anthracite-800 dark:hover:text-stone-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {navigation.map((item) => {
                  const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                            : "text-anthracite-600 hover:bg-stone-50 hover:text-anthracite-900 dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
                        )}
                      >
                        <svg
                          className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-brand-600 dark:text-brand-400" : "text-stone-400 dark:text-stone-500")}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-stone-100 p-4 dark:border-stone-700/50">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-xs text-stone-400 hover:text-anthracite-700 dark:text-stone-500 dark:hover:text-stone-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Voir le site public
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
