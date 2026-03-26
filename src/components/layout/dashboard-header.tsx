"use client";

import { Button } from "@/components/ui";
import { useSidebar } from "./dashboard-sidebar";

export function DashboardHeader({
  user,
}: {
  user?: { firstName: string; lastName: string; role: string } | null;
}) {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      {/* Hamburger on mobile */}
      <button
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 active:bg-stone-200 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-anthracite-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-stone-400">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Déconnexion</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </Button>
        </form>
      </div>
    </header>
  );
}
