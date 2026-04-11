import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { CookiePreferencesButton } from "@/components/cookie-preferences-button";

export const metadata: Metadata = {
  title: "Politique cookies",
  description:
    "Informations sur l'utilisation des cookies et traceurs sur le site " +
    APP_NAME +
    ".",
};

export default function PolitiqueCookiesPage() {
  return (
    <section className="section-padding bg-white dark:bg-anthracite-950">
      <div className="container-page max-w-4xl">
        <header className="mb-12">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            RGPD
          </p>
          <h1 className="heading-display mt-2">Politique cookies</h1>
          <p className="mt-4 text-sm text-anthracite-500 dark:text-stone-400">
            Dernière mise à jour : 11 avril 2026
          </p>
        </header>

        <div className="space-y-8 text-anthracite-700 dark:text-stone-300">
          <article>
            <h2 className="heading-section">Qu&apos;est-ce qu&apos;un cookie&nbsp;?</h2>
            <p className="mt-4 leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre terminal
              (ordinateur, tablette, smartphone) lors de la consultation d&apos;un
              site web. Il permet au site de mémoriser des informations relatives
              à votre navigation (préférences, identifiant de session,
              statistiques de visite, etc.).
            </p>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} utilise des cookies conformément aux recommandations de
              la Commission Nationale de l&apos;Informatique et des Libertés
              (CNIL) et à la directive ePrivacy.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Catégories de cookies utilisés</h2>

            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 dark:border-stone-700 dark:bg-anthracite-900/50">
                <h3 className="heading-card">Cookies strictement nécessaires</h3>
                <p className="mt-2 text-sm">
                  <strong>Consentement&nbsp;:</strong> non requis (exemptés)
                </p>
                <p className="mt-3 leading-relaxed">
                  Ces cookies sont indispensables au bon fonctionnement du site.
                  Ils permettent notamment la gestion de votre session, la
                  sécurité, l&apos;authentification et la mémorisation de votre
                  choix en matière de cookies. Sans eux, certaines
                  fonctionnalités ne peuvent pas être assurées.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                  <li>
                    <code>ra_session</code>&nbsp;: gestion de la session
                    utilisateur (durée&nbsp;: session)
                  </li>
                  <li>
                    <code>ra_cookie_consent</code>&nbsp;: mémorisation de vos
                    préférences cookies (durée&nbsp;: 6 mois)
                  </li>
                  <li>
                    <code>theme</code>&nbsp;: mémorisation du thème clair/sombre
                    (durée&nbsp;: 1 an)
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 dark:border-stone-700 dark:bg-anthracite-900/50">
                <h3 className="heading-card">Cookies de mesure d&apos;audience</h3>
                <p className="mt-2 text-sm">
                  <strong>Consentement&nbsp;:</strong> requis
                </p>
                <p className="mt-3 leading-relaxed">
                  Ces cookies nous permettent de comptabiliser les visites,
                  d&apos;identifier les pages les plus consultées et d&apos;améliorer
                  l&apos;expérience utilisateur. Les données collectées sont
                  anonymisées et ne sont pas utilisées à des fins publicitaires.
                </p>
                <p className="mt-3 text-sm">
                  Durée maximale&nbsp;: 13 mois.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 dark:border-stone-700 dark:bg-anthracite-900/50">
                <h3 className="heading-card">Cookies fonctionnels</h3>
                <p className="mt-2 text-sm">
                  <strong>Consentement&nbsp;:</strong> requis
                </p>
                <p className="mt-3 leading-relaxed">
                  Ces cookies permettent d&apos;améliorer votre expérience en
                  mémorisant vos préférences (recherches récentes, critères
                  sauvegardés, zones géographiques favorites).
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 dark:border-stone-700 dark:bg-anthracite-900/50">
                <h3 className="heading-card">Cookies marketing et publicitaires</h3>
                <p className="mt-2 text-sm">
                  <strong>Consentement&nbsp;:</strong> requis
                </p>
                <p className="mt-3 leading-relaxed">
                  Ces cookies sont susceptibles d&apos;être déposés par des
                  partenaires publicitaires afin de vous proposer des publicités
                  en rapport avec vos centres d&apos;intérêt. Ils sont désactivés
                  par défaut.
                </p>
              </div>
            </div>
          </article>

          <article>
            <h2 className="heading-section">Gestion de vos préférences</h2>
            <p className="mt-4 leading-relaxed">
              Lors de votre première visite, un bandeau vous permet
              d&apos;accepter, de refuser ou de personnaliser le dépôt de cookies
              soumis à consentement. Vous pouvez modifier vos préférences à tout
              moment en cliquant sur le bouton ci-dessous&nbsp;:
            </p>
            <div className="mt-6">
              <CookiePreferencesButton />
            </div>
          </article>

          <article>
            <h2 className="heading-section">Paramétrage via votre navigateur</h2>
            <p className="mt-4 leading-relaxed">
              Vous pouvez également configurer votre navigateur afin d&apos;être
              informé du dépôt de cookies ou pour les refuser. Chaque
              navigateur propose des modalités de gestion différentes&nbsp;:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/fr-fr/microsoft-edge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="mt-4 leading-relaxed">
              Le refus de certains cookies est susceptible d&apos;altérer votre
              expérience de navigation sur le site.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Durée de conservation du consentement</h2>
            <p className="mt-4 leading-relaxed">
              Conformément aux recommandations de la CNIL, le choix que vous
              exprimez concernant les cookies est conservé pendant une durée
              maximale de six (6) mois. À l&apos;issue de ce délai, votre
              consentement vous sera à nouveau demandé.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Pour en savoir plus</h2>
            <p className="mt-4 leading-relaxed">
              Pour toute information complémentaire, vous pouvez consulter notre{" "}
              <Link
                href="/politique-confidentialite"
                className="text-brand-600 underline hover:text-brand-700"
              >
                politique de confidentialité
              </Link>{" "}
              ou nous contacter à{" "}
              <a
                href="mailto:contact@retailavenue.fr"
                className="text-brand-600 underline hover:text-brand-700"
              >
                contact@retailavenue.fr
              </a>
              .
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
