import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.APP_URL || "https://retail-avenue.fr";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/biens`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/agence`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/recherche-local`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/proposer-bien`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/politique-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/politique-cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await prisma.property.findMany({
      where: {
        isPublished: true,
        status: "ACTIF",
        confidentiality: "PUBLIC",
      },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    });
    propertyRoutes = properties.map((p) => ({
      url: `${SITE_URL}/biens/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unreachable at build time → fall back to static-only sitemap
  }

  return [...staticRoutes, ...propertyRoutes];
}
