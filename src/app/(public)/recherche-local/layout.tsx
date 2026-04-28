import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Décrivez votre recherche de local",
  description:
    "Décrivez votre projet d'implantation à Paris : type de local, arrondissement, surface, budget. Notre équipe vous recontacte sous 24h avec une sélection adaptée.",
  alternates: { canonical: "/recherche-local" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Recherche de local commercial à Paris",
    description:
      "Confiez votre cahier des charges à Retail Avenue. Sélection sur-mesure de locaux commerciaux à Paris.",
  },
};

export default function RechercheLocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
