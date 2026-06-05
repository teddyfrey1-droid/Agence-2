import {
  APP_NAME,
  APP_DESCRIPTION,
  SITE_URL,
  BRAND_ALTERNATE_NAMES,
} from "@/lib/constants";
import { getAgencyInfo } from "@/lib/agency";

/**
 * Site-wide JSON-LD structured data.
 *
 * This is the strongest on-page signal we control for branded search: it tells
 * Google that the entity "Retail Avenue" is officially represented by
 * retail-avenue.fr. A well-formed Organization + WebSite graph is what powers
 * the knowledge panel, sitelinks and the canonical brand result — making it far
 * more likely that retail-avenue.fr is the #1 hit for the query "retail avenue"
 * rather than any similarly-named site.
 *
 * Social/profile URLs (sameAs) are read from env so they can be added without a
 * code change — every additional authoritative reference reinforces the entity.
 */
function sameAsLinks(): string[] {
  const raw = process.env.NEXT_PUBLIC_SOCIAL_LINKS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function StructuredData() {
  const agency = await getAgencyInfo();

  const name = agency.name || APP_NAME;
  const email = agency.email || "contact@retailavenue.fr";
  const description = agency.description || APP_DESCRIPTION;
  const logoUrl = `${SITE_URL}/icons/apple-touch-icon.png`;

  const organization: Record<string, unknown> = {
    "@type": ["RealEstateAgent", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name,
    alternateName: BRAND_ALTERNATE_NAMES.filter((n) => n !== name),
    url: SITE_URL,
    logo: logoUrl,
    image: `${SITE_URL}/hero-paris.jpg`,
    description,
    email,
    areaServed: [
      { "@type": "City", name: "Paris" },
      { "@type": "AdministrativeArea", name: "Île-de-France" },
    ],
    knowsLanguage: "fr",
  };

  if (agency.phone) organization.telephone = agency.phone;

  if (agency.address || agency.city || agency.zipCode) {
    organization.address = {
      "@type": "PostalAddress",
      ...(agency.address ? { streetAddress: agency.address } : {}),
      addressLocality: agency.city || "Paris",
      ...(agency.zipCode ? { postalCode: agency.zipCode } : {}),
      addressCountry: "FR",
    };
  }

  const sameAs = sameAsLinks();
  if (sameAs.length > 0) organization.sameAs = sameAs;

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name,
    alternateName: BRAND_ALTERNATE_NAMES.filter((n) => n !== name),
    inLanguage: "fr-FR",
    description,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD is static, server-rendered and contains no user input → safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
