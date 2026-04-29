"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}>({ isOpen: false, toggle: () => {}, close: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((v) => !v),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { name: "Accueil", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { name: "Biens", href: "/dashboard/biens", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
      { name: "Demandes", href: "/dashboard/demandes", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
      { name: "Contacts", href: "/dashboard/contacts", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { name: "Dormants", href: "/dashboard/contacts/dormants", icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
      { name: "Terrain", href: "/dashboard/terrain", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { name: "Matches", href: "/dashboard/matches", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { name: "Dossiers", href: "/dashboard/dossiers", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
      { name: "Pipeline", href: "/dashboard/dossiers/pipeline", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
      { name: "Carte", href: "/dashboard/carte", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
      { name: "Panneaux", href: "/dashboard/panneaux", icon: "M4 4h16v4H4zM4 12h10v8H4zM16 12h4v4h-4zM16 18h4v2h-4z" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { name: "Calendrier", href: "/dashboard/calendrier", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
      { name: "Visites", href: "/dashboard/visites", icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" },
      { name: "Tâches", href: "/dashboard/taches", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
      { name: "Interactions", href: "/dashboard/interactions", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { name: "Performance", href: "/dashboard/performance", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { name: "Marché", href: "/dashboard/marche", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
    ],
  },
  {
    label: "Système",
    items: [
      { name: "Paramètres", href: "/dashboard/parametres", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { name: "Admin", href: "/dashboard/admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
    ],
  },
];

interface SidebarProps {
  badges?: Record<string, number>;
}

export function DashboardSidebar({ badges = {} }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((h) => (h === "/dashboard" ? pathname === "/dashboard" : pathname === h || pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar — always dark */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-anthracite-950 shadow-xl transition-transform duration-300 ease-in-out lg:z-40 lg:w-64 lg:translate-x-0 lg:shadow-none",
          "border-white/[0.06]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Subtle brand glow at the top — luxe accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_60%_120%_at_50%_0%,rgba(176,146,106,0.18),transparent_70%)]" />

        {/* Logo */}
        <div className="relative border-b border-white/[0.06] px-4 pt-safe">
          <div className="flex h-16 items-center justify-between">
            <Logo size="sm" />
            <button
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/70 lg:hidden transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="scrollbar-sidebar relative flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-6")}>
              <div className="mb-2 flex items-center gap-2 px-3">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/30">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === activeHref;
                  const badge = badges[item.href];
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className={cn(
                          "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-brand-500/[0.18] via-brand-500/[0.08] to-transparent text-brand-100"
                            : "text-white/55 hover:bg-white/[0.05] hover:text-white/90 active:bg-white/[0.1]"
                        )}
                      >
                        {/* Active left bar — luxe gold */}
                        {isActive && (
                          <span className="pointer-events-none absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-champagne-300 via-brand-400 to-brand-600" />
                        )}
                        <svg
                          className={cn(
                            "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                            isActive
                              ? "text-brand-300"
                              : "text-white/40 group-hover/nav:text-white/75"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.6}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        <span className="flex-1 leading-none">{item.name}</span>
                        {badge != null && badge > 0 && (
                          <span
                            className={cn(
                              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9.5px] font-bold tabular-nums",
                              isActive
                                ? "bg-brand-500 text-anthracite-950"
                                : "bg-red-500 text-white",
                            )}
                          >
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom — public site link, refined */}
        <div className="border-t border-white/[0.06] p-3 pb-safe">
          <Link
            href="/"
            onClick={close}
            className="group/back flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-white/35 transition-all hover:bg-white/[0.04] hover:text-white/70"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.04] transition-colors group-hover/back:bg-white/[0.08]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
            <div className="flex-1 leading-tight">
              <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.14em]">
                Site public
              </p>
              <p className="mt-0.5 font-sans text-[10px] text-white/25">
                retail-avenue.fr
              </p>
            </div>
            <svg className="h-3 w-3 text-white/25 transition-all group-hover/back:translate-x-0.5 group-hover/back:text-white/50" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
          </Link>
        </div>
      </aside>
    </>
  );
}
