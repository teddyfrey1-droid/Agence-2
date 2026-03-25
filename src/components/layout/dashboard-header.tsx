"use client";

import { Button } from "@/components/ui";

export function DashboardHeader({
  user,
}: {
  user?: { firstName: string; lastName: string; role: string } | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-6 backdrop-blur-sm">
      <div />

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
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
          <Button variant="ghost" size="sm" type="submit">
            Déconnexion
          </Button>
        </form>
      </div>
    </header>
  );
}
