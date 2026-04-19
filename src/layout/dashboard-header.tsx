"use client";

import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { useSidebar } from "./dashboard-sidebar";

export function DashboardHeader({
  user,
}: {
  user?: { firstName: string; lastName: string; role: string } | null;
}) {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/85 backdrop-blur-md pt-safe dark:border-anthracite-800 dark:bg-anthracite-950/80">
      {/* Inner row — fixed height so safe-area padding sits above it */}
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        {/* Left: hamburger + search */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={toggle}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 active:bg-stone-200 lg:hidden dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
            aria-label="Ouvrir le menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <GlobalSearch />
        </div>

        {/* Right: actions + user */}
        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <NotificationBell />
          {user && (
            <div className="ml-1 flex items-center gap-2.5 rounded-full border border-stone-200/70 bg-white py-1 pl-1 pr-3 shadow-card dark:border-anthracite-800 dark:bg-anthracite-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-brand-400 text-xs font-semibold text-anthracite-900 shadow-inner dark:from-brand-700 dark:to-brand-500 dark:text-anthracite-950">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-semibold leading-tight text-anthracite-800 dark:text-stone-100">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10.5px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {user.role}
                </p>
              </div>
            </div>
          )}
          <form action="/api/auth/logout" method="POST">
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-xs text-stone-500 hover:text-anthracite-800 dark:text-stone-400 dark:hover:text-stone-200 sm:text-sm"
              aria-label="Déconnexion"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
