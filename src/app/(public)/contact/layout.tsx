import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'équipe Retail Avenue pour vos projets immobiliers commerciaux à Paris : implantation, cession de bail, vente ou location de locaux.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Contactez Retail Avenue",
    description:
      "Une question, un projet ? Notre équipe immobilier commercial à Paris vous répond.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
