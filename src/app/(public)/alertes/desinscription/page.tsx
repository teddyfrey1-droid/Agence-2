import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Désinscription des alertes",
  robots: { index: false, follow: false },
};

export default async function AlertUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let status: "ok" | "notfound" | "missing" = "missing";
  if (token) {
    try {
      const result = await prisma.propertyAlert.updateMany({
        where: { token },
        data: { isActive: false },
      });
      status = result.count > 0 ? "ok" : "notfound";
    } catch {
      status = "notfound";
    }
  }

  return (
    <section className="bg-white py-28 sm:py-36 dark:bg-anthracite-950">
      <div className="container-page">
        <div className="mx-auto max-w-lg border border-stone-200 bg-white p-10 text-center sm:p-14 dark:border-stone-800 dark:bg-anthracite-900">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-600 dark:text-champagne-400">
            Alertes email
          </p>
          <h1 className="mt-4 font-serif text-2xl italic text-anthracite-900 sm:text-3xl dark:text-stone-100">
            {status === "ok"
              ? "Vous êtes désinscrit."
              : status === "notfound"
                ? "Cette alerte n'existe plus."
                : "Lien de désinscription invalide."}
          </h1>
          <p className="mx-auto mt-4 max-w-sm font-sans text-sm leading-loose text-stone-500 dark:text-stone-400">
            {status === "ok"
              ? "Vous ne recevrez plus d'emails pour cette alerte. Vous pouvez en créer une nouvelle à tout moment."
              : "L'alerte associée à ce lien a peut-être déjà été désactivée."}
          </p>
          <Link
            href="/biens"
            className="mt-8 inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase text-brand-700 transition-colors hover:text-brand-800 dark:text-champagne-300 dark:hover:text-champagne-200"
          >
            Voir les biens disponibles →
          </Link>
        </div>
      </div>
    </section>
  );
}
