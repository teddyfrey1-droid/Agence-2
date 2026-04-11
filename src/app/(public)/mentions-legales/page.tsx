import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site " + APP_NAME + ".",
};

export default function MentionsLegalesPage() {
  return (
    <section className="section-padding bg-white dark:bg-anthracite-950">
      <div className="container-page max-w-4xl">
        <header className="mb-12">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            Informations légales
          </p>
          <h1 className="heading-display mt-2">Mentions légales</h1>
          <p className="mt-4 text-sm text-anthracite-500 dark:text-stone-400">
            Dernière mise à jour : 11 avril 2026
          </p>
        </header>

        <div className="space-y-8 text-anthracite-700 dark:text-stone-300">
          <article>
            <h2 className="heading-section">Éditeur du site</h2>
            <p className="mt-4 leading-relaxed">
              Le présent site est édité par {APP_NAME}, société dont les
              coordonnées sont les suivantes&nbsp;:
            </p>
            <ul className="mt-4 list-none space-y-2">
              <li>
                <strong>Dénomination sociale&nbsp;:</strong> {APP_NAME}
              </li>
              <li>
                <strong>Forme juridique&nbsp;:</strong> SAS
              </li>
              <li>
                <strong>Siège social&nbsp;:</strong> Paris, France
              </li>
              <li>
                <strong>Capital social&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>RCS&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>SIRET&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>N° TVA intracommunautaire&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>Téléphone&nbsp;:</strong> 01 00 00 00 00
              </li>
              <li>
                <strong>Courriel&nbsp;:</strong>{" "}
                <a
                  href="mailto:contact@retailavenue.fr"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  contact@retailavenue.fr
                </a>
              </li>
              <li>
                <strong>Directeur de la publication&nbsp;:</strong> à compléter
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">
              Carte professionnelle et activité réglementée
            </h2>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} exerce l&apos;activité de transaction sur immeubles et
              fonds de commerce en application de la loi n° 70-9 du 2 janvier
              1970 (loi Hoguet) et de son décret d&apos;application n° 72-678 du
              20 juillet 1972.
            </p>
            <ul className="mt-4 list-none space-y-2">
              <li>
                <strong>Carte professionnelle n°&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>Délivrée par&nbsp;:</strong> CCI de Paris Île-de-France
              </li>
              <li>
                <strong>Garantie financière&nbsp;:</strong> à compléter
              </li>
              <li>
                <strong>Assurance RC professionnelle&nbsp;:</strong> à compléter
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">Hébergeur</h2>
            <p className="mt-4 leading-relaxed">
              Le site est hébergé par&nbsp;:
            </p>
            <ul className="mt-4 list-none space-y-2">
              <li>
                <strong>Dénomination&nbsp;:</strong> Vercel Inc.
              </li>
              <li>
                <strong>Adresse&nbsp;:</strong> 440 N Barranca Ave #4133, Covina,
                CA 91723, États-Unis
              </li>
              <li>
                <strong>Site web&nbsp;:</strong>{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  vercel.com
                </a>
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">Propriété intellectuelle</h2>
            <p className="mt-4 leading-relaxed">
              L&apos;ensemble des éléments du site (textes, photographies,
              illustrations, graphismes, logos, marques, structure, code) est
              protégé par le droit de la propriété intellectuelle et est la
              propriété exclusive de {APP_NAME} ou de ses partenaires.
            </p>
            <p className="mt-4 leading-relaxed">
              Toute reproduction, représentation, modification, publication ou
              adaptation de tout ou partie des éléments du site, quel que soit le
              moyen ou le procédé utilisé, est interdite sans autorisation écrite
              préalable de {APP_NAME}.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Responsabilité</h2>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} s&apos;efforce d&apos;assurer au mieux de ses possibilités
              l&apos;exactitude et la mise à jour des informations diffusées sur
              le site. Toutefois, {APP_NAME} ne peut garantir l&apos;exactitude,
              la précision ou l&apos;exhaustivité des informations mises à
              disposition. En conséquence, {APP_NAME} décline toute responsabilité
              pour toute imprécision, inexactitude ou omission portant sur des
              informations disponibles sur le site.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Liens hypertextes</h2>
            <p className="mt-4 leading-relaxed">
              Le site peut contenir des liens hypertextes vers d&apos;autres
              sites. {APP_NAME} n&apos;exerce aucun contrôle sur ces sites et
              décline toute responsabilité quant à leur contenu.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Données personnelles et cookies</h2>
            <p className="mt-4 leading-relaxed">
              Le traitement des données personnelles et l&apos;utilisation de
              cookies sur le site sont décrits dans notre{" "}
              <Link
                href="/politique-confidentialite"
                className="text-brand-600 underline hover:text-brand-700"
              >
                politique de confidentialité
              </Link>{" "}
              et notre{" "}
              <Link
                href="/politique-cookies"
                className="text-brand-600 underline hover:text-brand-700"
              >
                politique cookies
              </Link>
              .
            </p>
          </article>

          <article>
            <h2 className="heading-section">Droit applicable</h2>
            <p className="mt-4 leading-relaxed">
              Les présentes mentions légales sont soumises au droit français.
              Tout litige relatif à leur interprétation ou à leur application
              sera de la compétence des tribunaux de Paris.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
