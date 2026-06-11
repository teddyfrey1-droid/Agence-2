import { SITE_URL } from "@/lib/site";
import type { AgencyInfo } from "@/lib/agency";

/**
 * Structured data injected on every public page.
 *
 * The WebSite + RealEstateAgent schemas tell Google that the brand
 * "Retail Avenue" lives at retail-avenue.fr — the key signal for the
 * brand query to surface this domain (instead of a legacy one) and to
 * display the correct site name in results.
 */
export function SeoJsonLd({ agency }: { agency: AgencyInfo }) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: agency.name,
    alternateName: ["Retail Avenue Paris", "retail-avenue.fr"],
    url: SITE_URL,
    inLanguage: "fr-FR",
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#organization`,
    name: agency.name,
    legalName: agency.legalName || undefined,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    image: `${SITE_URL}/hero-paris.jpg`,
    description:
      agency.description ||
      "Agence d'immobilier commercial et professionnel à Paris : locaux commerciaux, boutiques, bureaux, cessions de bail et fonds de commerce.",
    telephone: agency.phone || undefined,
    email: agency.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: agency.address || undefined,
      postalCode: agency.zipCode || undefined,
      addressLocality: agency.city || "Paris",
      addressCountry: "FR",
    },
    areaServed: [
      { "@type": "City", name: "Paris" },
      { "@type": "AdministrativeArea", name: "Île-de-France" },
    ],
    knowsAbout: [
      "Immobilier commercial",
      "Locaux commerciaux",
      "Cession de bail",
      "Fonds de commerce",
      "Murs commerciaux",
    ],
    priceRange: "$$",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
