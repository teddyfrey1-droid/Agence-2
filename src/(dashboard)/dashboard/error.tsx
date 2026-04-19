"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <svg className="h-10 w-10 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Une erreur est survenue</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
        Un probleme inattendu s&apos;est produit. Veuillez reessayer.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Reessayer</Button>
      </div>
    </div>
  );
}
