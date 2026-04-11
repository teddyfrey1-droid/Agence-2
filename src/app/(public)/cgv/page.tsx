import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions Générales de Vente et de Services de " + APP_NAME + ".",
};

export default function CGVPage() {
  return (
    <section className="section-padding bg-white dark:bg-anthracite-950">
      <div className="container-page max-w-4xl">
        <header className="mb-12">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            Informations légales
          </p>
          <h1 className="heading-display mt-2">
            Conditions Générales de Vente
          </h1>
          <p className="mt-4 text-sm text-anthracite-500 dark:text-stone-400">
            Dernière mise à jour : 11 avril 2026
          </p>
        </header>

        <div className="prose-legal space-y-8 text-anthracite-700 dark:text-stone-300">
          <article>
            <h2 className="heading-section">Article 1 — Objet</h2>
            <p className="mt-4 leading-relaxed">
              Les présentes Conditions Générales de Vente (ci-après «&nbsp;CGV&nbsp;»)
              s&apos;appliquent, sans restriction ni réserve, à l&apos;ensemble des
              prestations de services proposées par {APP_NAME} (ci-après «&nbsp;l&apos;Agence&nbsp;»)
              dans le cadre de son activité de conseil, d&apos;intermédiation et de
              transaction en immobilier commercial et professionnel à Paris et en
              Île-de-France.
            </p>
            <p className="mt-4 leading-relaxed">
              Toute commande d&apos;une prestation, ou signature d&apos;un mandat,
              implique l&apos;adhésion pleine et entière du Client aux présentes CGV.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 2 — Prestations proposées</h2>
            <p className="mt-4 leading-relaxed">L&apos;Agence propose notamment&nbsp;:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                La recherche et la mise en relation pour la vente ou la location de
                locaux commerciaux, bureaux, boutiques, restaurants, entrepôts,
                murs et fonds de commerce.
              </li>
              <li>
                L&apos;estimation et l&apos;évaluation de biens immobiliers
                professionnels.
              </li>
              <li>
                Le conseil en implantation et la recherche de locaux pour le compte
                d&apos;enseignes ou d&apos;investisseurs.
              </li>
              <li>
                L&apos;accompagnement à la négociation, à la rédaction de
                compromis, de baux commerciaux et au suivi jusqu&apos;à la signature
                définitive.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">Article 3 — Mandat et commande</h2>
            <p className="mt-4 leading-relaxed">
              Conformément à la loi n° 70-9 du 2 janvier 1970 (dite loi Hoguet) et à
              son décret d&apos;application, toute mission confiée à l&apos;Agence
              fait l&apos;objet d&apos;un mandat écrit, précisant la nature de la
              mission, sa durée, le montant de la rémunération et la partie à qui
              elle incombe.
            </p>
            <p className="mt-4 leading-relaxed">
              Aucune somme ne pourra être exigée avant la conclusion effective et
              définitive de l&apos;opération confiée.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 4 — Honoraires et tarifs</h2>
            <p className="mt-4 leading-relaxed">
              Les honoraires de l&apos;Agence sont librement fixés et affichés en
              agence ainsi que sur le site internet, conformément à l&apos;arrêté du
              10 janvier 2017 relatif à l&apos;information des consommateurs par les
              professionnels intervenant dans les transactions immobilières.
            </p>
            <p className="mt-4 leading-relaxed">
              Sauf indication contraire, les tarifs sont exprimés en euros et toutes
              taxes comprises (TTC). L&apos;Agence se réserve le droit de modifier
              ses tarifs à tout moment, les tarifs applicables étant ceux en vigueur
              à la date de signature du mandat.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 5 — Modalités de paiement</h2>
            <p className="mt-4 leading-relaxed">
              Les honoraires sont exigibles à la date de la signature de l&apos;acte
              authentique constatant la réalisation de l&apos;opération (vente,
              cession de bail, location, cession de fonds de commerce).
            </p>
            <p className="mt-4 leading-relaxed">
              Tout retard de paiement entraînera de plein droit l&apos;application
              de pénalités de retard au taux d&apos;intérêt légal majoré de cinq
              points, ainsi qu&apos;une indemnité forfaitaire de quarante (40) euros
              pour frais de recouvrement, conformément aux articles L.441-10 et
              D.441-5 du Code de commerce.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 6 — Obligations du Client</h2>
            <p className="mt-4 leading-relaxed">Le Client s&apos;engage à&nbsp;:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Fournir à l&apos;Agence l&apos;ensemble des informations et
                documents nécessaires à la bonne exécution de la mission&nbsp;;
              </li>
              <li>
                Garantir l&apos;exactitude et la sincérité des informations
                transmises&nbsp;;
              </li>
              <li>
                Respecter l&apos;exclusivité éventuellement consentie à l&apos;Agence
                dans le cadre du mandat&nbsp;;
              </li>
              <li>
                Informer sans délai l&apos;Agence de toute modification susceptible
                d&apos;affecter la mission.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="heading-section">Article 7 — Obligations de l&apos;Agence</h2>
            <p className="mt-4 leading-relaxed">
              L&apos;Agence s&apos;engage à exécuter sa mission avec diligence,
              loyauté et dans le respect des règles déontologiques de sa profession.
              Elle est soumise à une obligation de moyens et non de résultat.
            </p>
            <p className="mt-4 leading-relaxed">
              L&apos;Agence dispose d&apos;une carte professionnelle délivrée par la
              CCI et d&apos;une assurance de responsabilité civile professionnelle,
              ainsi que d&apos;une garantie financière conforme à la réglementation
              en vigueur.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 8 — Droit de rétractation</h2>
            <p className="mt-4 leading-relaxed">
              Conformément aux articles L.221-18 et suivants du Code de la
              consommation, le Client consommateur disposant d&apos;un mandat
              conclu à distance ou hors établissement bénéficie d&apos;un délai de
              quatorze (14) jours pour exercer son droit de rétractation, sans
              avoir à justifier de motif ni à supporter de pénalité.
            </p>
            <p className="mt-4 leading-relaxed">
              Le droit de rétractation peut être exercé en notifiant la décision
              par courrier recommandé avec accusé de réception ou par courriel à
              l&apos;adresse indiquée sur le mandat.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 9 — Données personnelles</h2>
            <p className="mt-4 leading-relaxed">
              L&apos;Agence traite les données personnelles du Client dans le respect
              du Règlement Général sur la Protection des Données (RGPD) et de la loi
              «&nbsp;Informatique et Libertés&nbsp;» du 6 janvier 1978 modifiée.
              Pour plus d&apos;informations, le Client est invité à consulter la{" "}
              <Link
                href="/politique-confidentialite"
                className="text-brand-600 underline hover:text-brand-700"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 10 — Responsabilité</h2>
            <p className="mt-4 leading-relaxed">
              La responsabilité de l&apos;Agence ne pourra être engagée qu&apos;en
              cas de faute prouvée dans l&apos;exécution de sa mission. En aucun
              cas, l&apos;Agence ne pourra être tenue pour responsable de
              dommages indirects tels que perte d&apos;exploitation, perte de
              chance ou préjudice commercial.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 11 — Force majeure</h2>
            <p className="mt-4 leading-relaxed">
              L&apos;Agence ne pourra être tenue pour responsable d&apos;un
              manquement à ses obligations contractuelles en cas de survenance
              d&apos;un événement de force majeure au sens de l&apos;article 1218
              du Code civil.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 12 — Médiation</h2>
            <p className="mt-4 leading-relaxed">
              Conformément à l&apos;article L.612-1 du Code de la consommation, en
              cas de litige n&apos;ayant pu être résolu à l&apos;amiable, le Client
              consommateur peut recourir gratuitement au service de médiation de la
              consommation. Les coordonnées du médiateur compétent seront
              communiquées sur simple demande.
            </p>
          </article>

          <article>
            <h2 className="heading-section">
              Article 13 — Droit applicable et juridiction compétente
            </h2>
            <p className="mt-4 leading-relaxed">
              Les présentes CGV sont soumises au droit français. Tout litige
              relatif à leur interprétation ou à leur exécution sera, à défaut de
              résolution amiable, de la compétence exclusive des tribunaux de
              Paris, sous réserve des règles impératives de compétence applicables
              aux consommateurs.
            </p>
          </article>

          <article>
            <h2 className="heading-section">Article 14 — Contact</h2>
            <p className="mt-4 leading-relaxed">
              Pour toute question relative aux présentes CGV, le Client peut
              adresser un courriel à{" "}
              <a
                href="mailto:contact@retailavenue.fr"
                className="text-brand-600 underline hover:text-brand-700"
              >
                contact@retailavenue.fr
              </a>{" "}
              ou nous contacter via la page{" "}
              <Link
                href="/contact"
                className="text-brand-600 underline hover:text-brand-700"
              >
                Contact
              </Link>
              .
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
