"use client";

export default function ClientError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
        Une erreur est survenue
      </h2>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Impossible de charger votre espace client. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Réessayer
      </button>
    </div>
  );
}
