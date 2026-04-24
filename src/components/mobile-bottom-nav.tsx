"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  match?: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Accueil",
    href: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    match: (p) => p === "/dashboard",
  },
  {
    name: "Biens",
    href: "/dashboard/biens",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    name: "Contacts",
    href: "/dashboard/contacts",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    name: "Matches",
    href: "/dashboard/matches",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on the dedicated full-screen capture page so the FAB doesn't collide
  // with its own action button.
  const hideOn = ["/dashboard/terrain/capture"];
  if (hideOn.includes(pathname)) return null;

  return (
    <>
      {/* Spacer so scrollable content isn't hidden behind the bar */}
      <div className="h-20 lg:hidden" aria-hidden />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/95 pb-safe backdrop-blur-lg dark:border-anthracite-800 dark:bg-anthracite-950/90 lg:hidden"
        aria-label="Navigation principale"
      >
        <div className="relative mx-auto grid max-w-xl grid-cols-5 items-stretch">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton key={item.href} item={item} pathname={pathname} />
          ))}

          {/* FAB — Quick capture — sits centered and overlaps the bar */}
          <div className="relative flex items-end justify-center">
            <Link
              href="/dashboard/terrain/capture"
              aria-label="Repérage rapide"
              className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-anthracite-900 to-anthracite-700 text-white shadow-xl shadow-anthracite-900/30 ring-4 ring-white transition-transform active:scale-95 dark:from-brand-500 dark:to-brand-600 dark:text-anthracite-950 dark:ring-anthracite-950"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </Link>
            <div className="h-16 w-full" aria-hidden />
          </div>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavButton key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavButton({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.match
    ? item.match(pathname)
    : pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-semibold transition-colors",
        isActive
          ? "text-brand-600 dark:text-brand-400"
          : "text-stone-500 hover:text-anthracite-900 dark:text-stone-400 dark:hover:text-stone-100"
      )}
    >
      <svg
        className={cn("h-5 w-5", isActive && "drop-shadow-sm")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isActive ? 2 : 1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      <span>{item.name}</span>
    </Link>
  );
}
