import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QUARTIERS, findQuartier } from "@/lib/quartiers";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PropertyAlertForm } from "@/components/property-alert-form";

export function generateStaticParams() {
  return QUARTIERS.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quartier = findQuartier(slug);
  if (!quartier) return { title: "Quartier introuvable" };
  return {
    title: `Local commercial ${quartier.name} — Paris`,
    description: `${quartier.tagline}. ${quartier.description[0]?.slice(0, 140)}…`,
    alternates: { canonical: `/quartiers/${quartier.slug}` },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      title: `Immobilier commercial ${quartier.name} — Retail Avenue`,
      description: quartier.tagline,
      images: ["/hero-paris.jpg"],
    },
  };
}

export default async function QuartierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quartier = findQuartier(slug);
  if (!quartier) notFound();

  let properties: {
    id: string;
    title: string;
    type: string;
    transactionType: string;
    district: string | null;
    city: string;
    price: number | null;
    rentMonthly: number | null;
    surfaceTotal: number | null;
    media: { url: string }[];
  }[] = [];
  try {
    properties = await prisma.property.findMany({
      where: {
        isPublished: true,
        status: "ACTIF",
        confidentiality: "PUBLIC",
        district: { in: quartier.arrondissements },
      },
      select: {
        id: true,
        title: true,
        type: true,
        transactionType: true,
        district: true,
        city: true,
        price: true,
        rentMonthly: true,
        surfaceTotal: true,
        media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
  } catch {
    /* DB unreachable at build — render the editorial content only */
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/hero-paris.jpg"
            alt={`Quartier ${quartier.name} à Paris`}
            fill
            className="object-cover object-center"
            priority
            quality={85}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p
            className="animate-reveal-fade font-sans text-[10px] font-semibold tracking-[0.5em] uppercase text-champagne-300"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            {quartier.arrondissements
              .map((a) => a.replace("er arrondissement", "ᵉʳ").replace("e arrondissement", "ᵉ"))
              .join(" · ")}{" "}
            arrondissement{quartier.arrondissements.length > 1 ? "s" : ""}
          </p>
          <h1
            className="animate-reveal-up delay-150 mt-6 font-serif text-4xl font-normal italic leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{ textShadow: "0 2px 28px rgba(0,0,0,0.7)" }}
          >
            {quartier.name}
          </h1>
          <div className="animate-reveal-fade delay-500 mx-auto mt-7 h-px w-14 bg-champagne-400" />
          <p
            className="animate-reveal-up delay-500 mt-7 font-serif text-lg italic text-stone-100 sm:text-xl"
            style={{ textShadow: "0 1px 16px rgba(0,0,0,0.9)" }}
          >
            {quartier.tagline}
          </p>
        </div>
      </section>

      {/* ── Analyse ── */}
      <section className="bg-white py-20 sm:py-28 dark:bg-anthracite-950">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <ScrollReveal variant="fade">
              <div className="flex items-center gap-4">
                <span className="rule-brand" />
                <p className="label-overline dark:text-champagne-400">Notre lecture du quartier</p>
              </div>
              {quartier.description.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="mt-6 font-sans text-base leading-loose text-stone-600 dark:text-stone-300"
                >
                  {paragraph}
                </p>
              ))}
            </ScrollReveal>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-px border border-stone-200 bg-stone-200 sm:grid-cols-3 dark:border-stone-800 dark:bg-stone-800">
            {quartier.strengths.map((s, i) => (
              <ScrollReveal key={s.title} variant="up" delay={i * 110} className="bg-white p-7 dark:bg-anthracite-950">
                <p className="font-serif text-sm italic text-champagne-600 dark:text-champagne-400">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-serif text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                  {s.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {s.description}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Biens du quartier ── */}
      {properties.length > 0 && (
        <section className="bg-brand-50 py-20 sm:py-24 dark:bg-anthracite-900">
          <div className="container-page">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <span className="rule-brand" />
                  <p className="label-overline dark:text-champagne-400">Disponible ici</p>
                </div>
                <h2 className="mt-4 font-serif text-3xl font-normal text-anthracite-900 sm:text-4xl dark:text-stone-100">
                  Nos biens — {quartier.name}
                </h2>
              </div>
              <Link
                href="/biens"
                className="hidden items-center gap-2 font-sans text-[10px] tracking-[0.25em] uppercase text-brand-600 transition-colors hover:text-brand-800 sm:inline-flex dark:text-champagne-400"
              >
                Toute la sélection →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => {
                const isLoc = property.transactionType === "LOCATION";
                return (
                  <Link key={property.id} href={`/biens/${property.id}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-200 dark:bg-anthracite-950">
                      {property.media[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={property.media[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300 dark:from-anthracite-800 dark:to-anthracite-700" />
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-brand-600 dark:text-champagne-400">
                        {PROPERTY_TYPE_LABELS[property.type] || property.type}
                      </p>
                      <h3 className="mt-1.5 truncate font-serif text-lg font-semibold text-anthracite-900 transition-colors group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-champagne-300">
                        {property.title}
                      </h3>
                      <div className="mt-1 flex items-center justify-between font-sans text-xs">
                        <span className="font-semibold text-anthracite-800 dark:text-stone-200">
                          {isLoc
                            ? property.rentMonthly
                              ? `${formatPrice(property.rentMonthly)}/mois`
                              : "Sur demande"
                            : property.price
                              ? formatPrice(property.price)
                              : "Sur demande"}
                        </span>
                        {property.surfaceTotal && (
                          <span className="text-stone-400 dark:text-stone-500">
                            {formatSurface(property.surfaceTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Alerte ciblée quartier ── */}
      <section className="bg-white py-20 sm:py-24 dark:bg-anthracite-950">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-overline dark:text-champagne-400">Alerte {quartier.name}</p>
            <h2 className="mt-4 font-serif text-3xl font-normal italic text-anthracite-900 sm:text-4xl dark:text-stone-100">
              Le prochain local ici sera peut-être le vôtre.
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Activez une alerte limitée à ce quartier : vous recevrez chaque
              nouvelle adresse dès sa mise en ligne.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl">
            <PropertyAlertForm defaultDistricts={quartier.arrondissements} />
          </div>
          <p className="mt-12 text-center">
            <Link
              href="/recherche-local"
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-brand-700 transition-colors hover:text-brand-800 dark:text-champagne-300 dark:hover:text-champagne-200"
            >
              Ou confiez-nous votre recherche →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
