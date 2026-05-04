"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BiensError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-anthracite-900 dark:text-stone-100">
        Impossible de charger les biens
      </h1>
      <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
        Le serveur a rencontré un problème en récupérant la liste. Réessayez ou
        nettoyez les filtres si vous en aviez appliqué.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-stone-400 dark:text-stone-500">
          ref&nbsp;: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Link href="/dashboard/biens">
          <Button variant="outline">Effacer les filtres</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}
