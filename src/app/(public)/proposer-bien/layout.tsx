import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposer un bien",
  description:
    "Vous êtes propriétaire, bailleur ou mandataire ? Proposez votre local commercial ou professionnel à Paris. Retail Avenue vous accompagne dans sa commercialisation.",
  alternates: { canonical: "/proposer-bien" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Proposer un local commercial — Retail Avenue",
    description:
      "Confiez votre bien commercial à une équipe d'experts du marché parisien.",
  },
};

export default function ProposerBienLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
