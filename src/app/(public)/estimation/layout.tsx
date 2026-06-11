import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estimation express de votre local commercial",
  description:
    "Estimez gratuitement votre local commercial à Paris : trois questions, un avis de valeur sous 48 h par un expert Retail Avenue. Sans engagement et confidentiel.",
  alternates: { canonical: "/estimation" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Estimation gratuite de votre local commercial — Retail Avenue",
    description:
      "Trois questions, un avis de valeur sous 48 h. Gratuit, confidentiel, sans engagement.",
  },
};

export default function EstimationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
