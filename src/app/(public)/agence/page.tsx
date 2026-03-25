import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "L'agence",
};

export default function AgencePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-brand-50 section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
              L&apos;agence
            </p>
            <h1 className="heading-display mt-2">
              Une expertise au service de vos projets
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-anthracite-500">
              {APP_NAME} est une agence spécialisée en immobilier commercial et
              professionnel à Paris. Notre équipe d&apos;experts vous accompagne
              dans tous vos projets immobiliers.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white">
        <div className="container-page">
          <h2 className="heading-section text-center">Nos valeurs</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Excellence",
                description:
                  "Nous visons l'excellence dans chaque mission, avec rigueur et professionnalisme.",
              },
              {
                title: "Transparence",
                description:
                  "Une relation de confiance basée sur la transparence et l'honnêteté.",
              },
              {
                title: "Proximité",
                description:
                  "Un accompagnement personnalisé et une disponibilité sans faille.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="rounded-premium border border-stone-200 p-8 text-center shadow-card"
              >
                <h3 className="font-serif text-xl font-semibold text-anthracite-900">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <h2 className="heading-section text-center">Notre expertise</h2>
            <div className="mt-8 space-y-6 text-body">
              <p>
                Implantés au cœur de Paris, nous maîtrisons les spécificités de
                chaque arrondissement et de chaque quartier. Notre connaissance
                approfondie du marché nous permet d&apos;identifier les meilleures
                opportunités pour nos clients.
              </p>
              <p>
                Que vous soyez à la recherche d&apos;une boutique sur les Grands
                Boulevards, d&apos;un bureau dans le Marais, d&apos;un restaurant à
                Saint-Germain ou d&apos;un local d&apos;activité en périphérie, nous mettons
                notre réseau et notre savoir-faire à votre service.
              </p>
              <p>
                Notre approche est fondée sur l&apos;écoute, l&apos;analyse et
                l&apos;accompagnement. Chaque projet est unique et mérite une attention
                particulière.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
