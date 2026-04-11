import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de protection des données personnelles de " + APP_NAME + ".",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <section className="section-padding bg-white dark:bg-anthracite-950">
      <div className="container-page max-w-4xl">
        <header className="mb-12">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            RGPD
          </p>
          <h1 className="heading-display mt-2">
            Politique de confidentialité
          </h1>
          <p className="mt-4 text-sm text-anthracite-500 dark:text-stone-400">
            Dernière mise à jour : 11 avril 2026
          </p>
        </header>

        <div className="space-y-8 text-anthracite-700 dark:text-stone-300">
          <article>
            <h2 className="heading-section">1. Introduction</h2>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} attache une importance particulière à la protection de
              vos données personnelles et au respect de votre vie privée. La
              présente politique de confidentialité a pour objet de vous
              informer, de manière claire et transparente, sur la manière dont
              vos données personnelles sont collectées, utilisées, conservées
              et protégées, conformément au Règlement (UE) 2016/679 du 27 avril
              2016 (dit «&nbsp;RGPD&nbsp;») et à la loi «&nbsp;Informatique et
              Libertés&nbsp;» n° 78-17 du 6 janvier 1978 modifiée.
            </p>
          </article>

          <article>
            <h2 className="heading-section">2. Responsable du traitement</h2>
            <p className="mt-4 leading-relaxed">
              Le responsable du traitement des données personnelles est&nbsp;:
            </p>
            <ul className="mt-4 list-none space-y-2">
              <li>
                <strong>{APP_NAME}</strong>
              </li>
              <li>Adresse&nbsp;: Paris, France</li>
              <li>
                Courriel&nbsp;:{" "}
                <a
                  href="mailto:contact@retailavenue.fr"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  contact@retailavenue.fr
                </a>
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">3. Données collectées</h2>
            <p className="mt-4 leading-relaxed">
              Dans le cadre de nos activités, nous pouvons être amenés à
              collecter les catégories de données suivantes&nbsp;:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Données d&apos;identification&nbsp;:</strong> nom,
                prénom, civilité.
              </li>
              <li>
                <strong>Coordonnées&nbsp;:</strong> adresse postale, adresse
                email, numéro de téléphone.
              </li>
              <li>
                <strong>Données professionnelles&nbsp;:</strong> raison sociale,
                fonction, SIRET.
              </li>
              <li>
                <strong>Données relatives à vos projets&nbsp;:</strong> type de
                bien recherché, critères, budget, historique d&apos;échanges.
              </li>
              <li>
                <strong>Données de connexion&nbsp;:</strong> adresse IP, logs,
                informations sur le navigateur et le terminal utilisé.
              </li>
              <li>
                <strong>Cookies et traceurs&nbsp;:</strong> voir notre{" "}
                <Link
                  href="/politique-cookies"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  politique cookies
                </Link>
                .
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">4. Finalités et bases légales</h2>
            <p className="mt-4 leading-relaxed">
              Vos données sont traitées pour les finalités suivantes&nbsp;:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="py-3 pr-4 font-semibold">Finalité</th>
                    <th className="py-3 pr-4 font-semibold">Base légale</th>
                    <th className="py-3 font-semibold">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  <tr>
                    <td className="py-3 pr-4">
                      Gestion des demandes de contact et de recherche de bien
                    </td>
                    <td className="py-3 pr-4">
                      Exécution de mesures précontractuelles
                    </td>
                    <td className="py-3">3 ans à compter du dernier contact</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      Gestion de la relation client et du mandat
                    </td>
                    <td className="py-3 pr-4">Exécution du contrat</td>
                    <td className="py-3">
                      Durée du contrat + 10 ans (obligation légale)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Envoi d&apos;informations commerciales</td>
                    <td className="py-3 pr-4">Consentement</td>
                    <td className="py-3">3 ans après dernier contact</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Respect des obligations légales</td>
                    <td className="py-3 pr-4">Obligation légale</td>
                    <td className="py-3">Selon la réglementation applicable</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      Mesure d&apos;audience et amélioration du site
                    </td>
                    <td className="py-3 pr-4">Consentement</td>
                    <td className="py-3">13 mois maximum</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article>
            <h2 className="heading-section">5. Destinataires des données</h2>
            <p className="mt-4 leading-relaxed">
              Vos données sont destinées au personnel habilité de {APP_NAME}
              chargé de traiter votre demande. Elles peuvent également être
              transmises à&nbsp;:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Nos prestataires techniques (hébergeur, fournisseur de services
                email, outils analytiques), dûment encadrés par des contrats
                conformes au RGPD&nbsp;;
              </li>
              <li>
                Nos partenaires intervenant dans la réalisation de votre projet
                (notaires, experts, diagnostiqueurs, etc.)&nbsp;;
              </li>
              <li>
                Les autorités administratives ou judiciaires lorsque la loi
                l&apos;exige.
              </li>
            </ul>
            <p className="mt-4 leading-relaxed">
              Nous ne cédons, ne louons ni ne vendons vos données personnelles
              à des tiers à des fins commerciales.
            </p>
          </article>

          <article>
            <h2 className="heading-section">6. Transfert hors de l&apos;Union européenne</h2>
            <p className="mt-4 leading-relaxed">
              Certains de nos prestataires peuvent être situés en dehors de
              l&apos;Espace économique européen. Dans ce cas, {APP_NAME}
              s&apos;assure que le transfert est encadré par des garanties
              appropriées&nbsp;: décision d&apos;adéquation de la Commission
              européenne ou clauses contractuelles types.
            </p>
          </article>

          <article>
            <h2 className="heading-section">7. Sécurité</h2>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} met en œuvre des mesures techniques et organisationnelles
              appropriées afin de protéger vos données contre toute destruction,
              perte, altération, divulgation ou accès non autorisé&nbsp;:
              chiffrement des communications (HTTPS), contrôle des accès,
              pseudonymisation, sauvegardes régulières et audits de sécurité.
            </p>
          </article>

          <article>
            <h2 className="heading-section">8. Vos droits</h2>
            <p className="mt-4 leading-relaxed">
              Conformément à la réglementation applicable, vous disposez des
              droits suivants sur vos données personnelles&nbsp;:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Droit d&apos;accès&nbsp;:</strong> obtenir la confirmation
                que des données vous concernant sont ou ne sont pas traitées et,
                lorsqu&apos;elles le sont, en obtenir une copie.
              </li>
              <li>
                <strong>Droit de rectification&nbsp;:</strong> demander la
                correction de données inexactes ou incomplètes.
              </li>
              <li>
                <strong>Droit à l&apos;effacement&nbsp;:</strong> demander la
                suppression de vos données dans certains cas.
              </li>
              <li>
                <strong>Droit à la limitation du traitement.</strong>
              </li>
              <li>
                <strong>Droit d&apos;opposition&nbsp;:</strong> vous opposer, pour
                des raisons tenant à votre situation particulière, à un
                traitement de vos données.
              </li>
              <li>
                <strong>Droit à la portabilité&nbsp;:</strong> recevoir les
                données vous concernant dans un format structuré et lisible par
                machine.
              </li>
              <li>
                <strong>Droit de retirer votre consentement</strong> à tout
                moment, sans remettre en cause la licéité du traitement fondé
                sur le consentement effectué avant son retrait.
              </li>
              <li>
                <strong>
                  Droit de définir des directives relatives au sort de vos
                  données après votre décès.
                </strong>
              </li>
            </ul>
            <p className="mt-4 leading-relaxed">
              Vous pouvez exercer ces droits en adressant un courriel à{" "}
              <a
                href="mailto:contact@retailavenue.fr"
                className="text-brand-600 underline hover:text-brand-700"
              >
                contact@retailavenue.fr
              </a>{" "}
              ou un courrier postal à notre adresse. Une preuve d&apos;identité
              pourra vous être demandée en cas de doute raisonnable sur votre
              identité.
            </p>
          </article>

          <article>
            <h2 className="heading-section">9. Réclamation auprès de la CNIL</h2>
            <p className="mt-4 leading-relaxed">
              Si vous estimez, après nous avoir contactés, que vos droits ne
              sont pas respectés, vous avez la possibilité d&apos;introduire une
              réclamation auprès de la Commission Nationale de l&apos;Informatique
              et des Libertés (CNIL)&nbsp;:
            </p>
            <ul className="mt-4 list-none space-y-1">
              <li>3 place de Fontenoy - TSA 80715 - 75334 Paris Cedex 07</li>
              <li>Téléphone&nbsp;: 01 53 73 22 22</li>
              <li>
                Site&nbsp;:{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  www.cnil.fr
                </a>
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">10. Modification de la politique</h2>
            <p className="mt-4 leading-relaxed">
              {APP_NAME} se réserve le droit de modifier à tout moment la
              présente politique de confidentialité afin de l&apos;adapter aux
              évolutions légales, réglementaires, jurisprudentielles et
              techniques. La date de la dernière mise à jour figure en haut de
              cette page.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
