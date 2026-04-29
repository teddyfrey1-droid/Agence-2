import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { findPropertyById } from "@/modules/properties";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await findPropertyById(id);

  if (!property || !property.isPublished || property.confidentiality !== "PUBLIC") {
    return {
      title: "Bien introuvable",
      robots: { index: false, follow: false },
    };
  }

  const typeLabel = PROPERTY_TYPE_LABELS[property.type] || property.type;
  const txLabel = TRANSACTION_TYPE_LABELS[property.transactionType];
  const location = property.district || property.city;
  const surface = property.surfaceTotal ? ` · ${formatSurface(property.surfaceTotal)}` : "";
  const description =
    property.description?.slice(0, 160) ||
    `${typeLabel} en ${txLabel.toLowerCase()} à ${location}${surface}. Découvrez ce bien sur Retail Avenue.`;

  const image = property.media[0]?.url;

  return {
    title: property.title,
    description,
    alternates: { canonical: `/biens/${property.id}` },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      title: `${property.title} — ${location}`,
      description,
      images: image ? [image] : ["/hero-paris.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} — ${location}`,
      description,
      images: image ? [image] : ["/hero-paris.jpg"],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await findPropertyById(id);

  if (!property || !property.isPublished) {
    // Legacy fallback: older emails linked /biens/<shareToken>. Redirect to the new share view.
    const share = await prisma.propertyShare.findUnique({
      where: { shareToken: id },
      select: { shareToken: true },
    });
    if (share) {
      redirect(`/biens/partage/${share.shareToken}`);
    }
    notFound();
  }

  const features = [
    property.hasExtraction && "Extraction",
    property.hasTerrace && "Terrasse",
    property.hasParking && "Parking",
    property.hasLoadingDock && "Quai de chargement",
  ].filter(Boolean) as string[];

  const isLocation = property.transactionType === "LOCATION";
  const location = property.district || property.city;
  const galleryMedia = property.media.slice(0, 5);

  // Key facts strip — what a serious buyer/tenant looks at first
  const keyFacts: { label: string; value: React.ReactNode }[] = [];
  if (property.surfaceTotal) {
    keyFacts.push({ label: "Surface", value: formatSurface(property.surfaceTotal) });
  }
  if (property.floor != null) {
    keyFacts.push({
      label: "Étage",
      value: property.floor === 0 ? "RDC" : `${property.floor}ᵉ`,
    });
  }
  if (property.facadeLength) {
    keyFacts.push({ label: "Façade", value: `${property.facadeLength} m` });
  }
  if (property.ceilingHeight) {
    keyFacts.push({ label: "H. sous plafond", value: `${property.ceilingHeight} m` });
  }

  return (
    <article className="bg-white pb-24 dark:bg-anthracite-950">
      {/* ── Gallery — full-bleed, sober ── */}
      <section className="relative">
        <div className="relative grid gap-1 overflow-hidden bg-stone-100 sm:grid-cols-4 sm:grid-rows-2 dark:bg-anthracite-900">
          {/* Main hero photo */}
          <div className="relative aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            {galleryMedia[0] ? (
              <Image
                src={galleryMedia[0].url}
                alt={property.title}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center text-stone-300 dark:text-stone-700">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" />
                </svg>
              </div>
            )}
          </div>
          {/* Secondary tiles */}
          {galleryMedia.slice(1, 5).map((m, i) => (
            <div key={m.id ?? i} className="relative hidden aspect-[4/3] sm:block">
              <Image
                src={m.url}
                alt={`${property.title} – photo ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ))}
          {/* Fillers if fewer than 5 photos */}
          {Array.from({ length: Math.max(0, 4 - Math.max(0, galleryMedia.length - 1)) }).map((_, i) => (
            <div
              key={`filler-${i}`}
              className="hidden aspect-[4/3] bg-stone-100 sm:block dark:bg-anthracite-900"
              aria-hidden="true"
            />
          ))}
        </div>
      </section>

      {/* ── Identity strip ── */}
      <div className="border-b border-stone-200/70 bg-stone-50/40 dark:border-anthracite-800 dark:bg-anthracite-900/40">
        <div className="container-page py-5">
          <nav className="mb-3 flex items-center gap-2 font-sans text-[11px] tracking-[0.18em] uppercase text-stone-500" aria-label="Fil d'Ariane">
            <Link href="/biens" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
              Nos biens
            </Link>
            <span aria-hidden>›</span>
            <span className="text-anthracite-700 dark:text-stone-300">{location}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.22em] text-brand-600 dark:text-brand-400">
                {PROPERTY_TYPE_LABELS[property.type] || property.type}
                <span className="text-stone-300 dark:text-stone-600"> · </span>
                <span className="text-stone-500 dark:text-stone-400">
                  {TRANSACTION_TYPE_LABELS[property.transactionType]}
                </span>
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-anthracite-900 sm:text-4xl md:text-5xl dark:text-stone-100">
                {property.title}
              </h1>
              <p className="mt-2 text-base text-stone-500 dark:text-stone-400">
                {location}
              </p>
            </div>

            {/* Inline price for mobile reading */}
            <div className="text-right lg:hidden">
              {isLocation ? (
                <>
                  <p className="font-display text-2xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                    {formatPrice(property.rentMonthly)}
                    <span className="ml-1 text-sm font-normal text-stone-400">/mois</span>
                  </p>
                  {property.charges && (
                    <p className="text-xs text-stone-500">+ {formatPrice(property.charges)} de charges</p>
                  )}
                </>
              ) : (
                <p className="font-display text-2xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                  {formatPrice(property.price)}
                </p>
              )}
            </div>
          </div>

          {/* Key facts — instant scan */}
          {keyFacts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-stone-200/70 pt-5 sm:grid-cols-4 dark:border-anthracite-800">
              {keyFacts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                    {f.label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-anthracite-900 tabular-nums dark:text-stone-100">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {/* ─ Main column ─ */}
          <div className="lg:col-span-2">
            {/* Description */}
            {property.description && (
              <div>
                <p className="label-overline">Description</p>
                <div className="mt-3 h-px w-12 bg-brand-400" />
                <p className="mt-6 whitespace-pre-line font-serif text-lg leading-relaxed text-anthracite-700 dark:text-stone-200">
                  {property.description}
                </p>
              </div>
            )}

            {/* Equipements */}
            {features.length > 0 && (
              <div className="mt-12">
                <p className="label-overline">Équipements</p>
                <div className="mt-3 h-px w-12 bg-brand-400" />
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 rounded-premium border border-stone-200/70 bg-stone-50/50 px-4 py-3 dark:border-anthracite-800 dark:bg-anthracite-900/40"
                    >
                      <svg className="h-4 w-4 flex-shrink-0 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Localisation note */}
            <div className="mt-12 rounded-premium border border-stone-200/70 bg-stone-50/50 px-5 py-4 dark:border-anthracite-800 dark:bg-anthracite-900/40">
              <p className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-400">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>
                  <span className="font-medium text-anthracite-800 dark:text-stone-200">Adresse exacte communiquée après prise de contact</span>{" "}
                  — par discrétion vis-à-vis du propriétaire et du commerce existant.
                </span>
              </p>
            </div>
          </div>

          {/* ─ Sticky sidebar ─ */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-premium border border-stone-200/70 bg-white shadow-premium dark:border-anthracite-800 dark:bg-anthracite-900">
              {/* Price block */}
              <div className="border-b border-stone-200/70 px-6 py-7 text-center dark:border-anthracite-800">
                {isLocation ? (
                  <>
                    <p className="font-display text-3xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                      {formatPrice(property.rentMonthly)}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                      par mois · HT HC
                    </p>
                    {property.charges && (
                      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                        + {formatPrice(property.charges)} de charges
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                      {formatPrice(property.price)}
                    </p>
                    {property.pricePerSqm && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                        {formatPrice(property.pricePerSqm)} / m²
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Reference + dates */}
              <dl className="space-y-2 border-b border-stone-200/70 px-6 py-5 text-sm dark:border-anthracite-800">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500 dark:text-stone-400">Référence</dt>
                  <dd className="font-mono text-xs font-semibold tracking-wider text-anthracite-800 dark:text-stone-200">
                    {property.reference}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500 dark:text-stone-400">Mis en ligne</dt>
                  <dd className="font-medium text-anthracite-700 dark:text-stone-300">
                    {formatDate(property.publishedAt)}
                  </dd>
                </div>
              </dl>

              {/* CTAs */}
              <div className="space-y-2.5 px-6 py-5">
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-premium bg-anthracite-900 py-3.5 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase text-white transition-colors hover:bg-anthracite-800 dark:bg-stone-100 dark:text-anthracite-950 dark:hover:bg-stone-200"
                >
                  Nous contacter
                </Link>
                <Link
                  href="/recherche-local"
                  className="flex w-full items-center justify-center gap-2 rounded-premium border border-stone-300 py-3.5 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase text-anthracite-800 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-stone-600 dark:text-stone-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
                >
                  Demander un mandat
                </Link>
              </div>

              {/* Reassurance footnote */}
              <div className="border-t border-stone-200/70 bg-stone-50/50 px-6 py-4 dark:border-anthracite-800 dark:bg-anthracite-800/30">
                <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                  Réponse sous 24 h ouvrées. Adresse exacte et conditions
                  détaillées communiquées après qualification.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
