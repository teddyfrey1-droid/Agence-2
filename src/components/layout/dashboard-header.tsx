"use client";

import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export function DashboardHeader({
  user,
}: {
  user?: { firstName: string; lastName: string; role: string } | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 dark:bg-anthracite-900/95 dark:border-stone-700/50">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <NotificationBell />
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit" className="hidden sm:inline-flex">
            Déconnexion
          </Button>
          <Button variant="ghost" size="sm" type="submit" className="sm:hidden px-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </Button>
        </form>
      </div>
    </header>
  );
}
