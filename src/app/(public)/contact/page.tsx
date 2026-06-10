import Link from "next/link";
import { getAgencyInfo } from "@/lib/agency";
import { ContactPageForm } from "@/components/contact-page-form";
import { ScrollReveal } from "@/components/scroll-reveal";

const REASSURANCE = [
  {
    title: "Réponse sous 24 h",
    description: "Chaque demande est lue et traitée personnellement par un consultant.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: "Confidentialité absolue",
    description: "Vos informations et votre projet restent strictement confidentiels.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Sans engagement",
    description: "Un premier échange en toute liberté, pour cadrer votre projet.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 12l3 3 5-6" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

export default async function ContactPage() {
  const agency = await getAgencyInfo();
  const phone = agency.phone?.trim() || null;
  const email = agency.email?.trim() || null;
  const location = [agency.city || "Paris", "Île-de-France"].join(" & ");

  return (
    <>
      {/* ── Hero — éditorial ── */}
      <section className="relative isolate overflow-hidden bg-gradient-premium py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(176,146,106,0.12),transparent_55%)]" />
        <div className="container-page text-center">
          <p className="label-overline dark:text-champagne-400">Contact</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Parlons de
            <span className="block not-italic font-semibold">votre projet</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Une question, une recherche, un bien à confier&nbsp;? Notre équipe
            vous répond sous 24&nbsp;heures.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          <div className="grid gap-14 lg:grid-cols-[5fr,7fr] lg:gap-16">
            {/* ── Colonne gauche — coordonnées & réassurance ── */}
            <ScrollReveal variant="left" className="block">
              <div className="flex items-center gap-4">
                <span className="rule-brand" />
                <p className="label-overline dark:text-champagne-400">Nos coordonnées</p>
              </div>
              <h2 className="mt-5 font-serif text-3xl font-normal leading-tight text-anthracite-900 sm:text-4xl dark:text-stone-100">
                Une équipe à votre écoute,{" "}
                <em className="font-semibold not-italic text-brand-700 dark:text-champagne-300">
                  au cœur de Paris.
                </em>
              </h2>

              <dl className="mt-10 space-y-px border-y border-stone-200 dark:border-stone-800">
                {phone && (
                  <div className="flex items-center justify-between gap-4 border-b border-stone-200 py-5 last:border-b-0 dark:border-stone-800">
                    <dt className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400">
                      Téléphone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="underline-grow font-serif text-lg text-anthracite-900 dark:text-stone-100"
                      >
                        {phone}
                      </a>
                    </dd>
                  </div>
                )}
                {email && (
                  <div className="flex items-center justify-between gap-4 border-b border-stone-200 py-5 last:border-b-0 dark:border-stone-800">
                    <dt className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400">
                      Email
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${email}`}
                        className="underline-grow font-serif text-lg text-anthracite-900 dark:text-stone-100"
                      >
                        {email}
                      </a>
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 py-5">
                  <dt className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400">
                    Secteur
                  </dt>
                  <dd className="font-serif text-lg text-anthracite-900 dark:text-stone-100">
                    {location}
                  </dd>
                </div>
              </dl>

              <ul className="mt-10 space-y-7">
                {REASSURANCE.map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-champagne-300/70 text-brand-700 [&>svg]:h-5 [&>svg]:w-5 dark:border-champagne-400/40 dark:text-champagne-400">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-serif text-base font-semibold text-anthracite-900 dark:text-stone-100">
                        {item.title}
                      </p>
                      <p className="mt-1 font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-12 border border-stone-200 bg-stone-50 p-7 dark:border-stone-800 dark:bg-anthracite-900">
                <p className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase text-champagne-700 dark:text-champagne-400">
                  Un projet précis ?
                </p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  Gagnez du temps&nbsp;: décrivez directement votre recherche de
                  local ou proposez votre bien.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/recherche-local"
                    className="underline-grow inline-flex w-fit items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-brand-700 dark:text-champagne-300"
                  >
                    Décrire ma recherche →
                  </Link>
                  <Link
                    href="/proposer-bien"
                    className="underline-grow inline-flex w-fit items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-brand-700 dark:text-champagne-300"
                  >
                    Proposer un bien →
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* ── Colonne droite — formulaire ── */}
            <ScrollReveal variant="right" delay={120} className="block">
              <ContactPageForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
