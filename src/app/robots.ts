import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/espace-client",
          "/espace-client/",
          "/login",
          "/inscription",
          "/activation",
          "/mot-de-passe-oublie",
          "/reinitialisation-mot-de-passe",
          "/panneau/",
          "/biens/partage/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
