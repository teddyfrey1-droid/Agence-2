"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center font-sans">
        <h2 className="text-2xl font-semibold text-stone-900">
          Erreur inattendue
        </h2>
        <p className="mt-2 text-stone-600">
          L&apos;application a rencontré un problème. Veuillez rafraîchir la page.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Rafraîchir
        </button>
      </body>
    </html>
  );
}
