import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.APP_URL || "https://retail-avenue.fr";
const INDEXNOW_KEY = "2d891bc2257e4ddb7fa1b473c0feac51";

const STATIC_URLS = [
  "/",
  "/biens",
  "/agence",
  "/contact",
  "/recherche-local",
  "/proposer-bien",
  "/mentions-legales",
  "/politique-confidentialite",
  "/politique-cookies",
  "/cgv",
];

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const urlList = STATIC_URLS.map((path) => `${SITE_URL}${path}`);

  const engines = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  const results: Record<string, number> = {};

  for (const engine of engines) {
    try {
      const res = await fetch(engine, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: new URL(SITE_URL).host,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList,
        }),
      });
      results[engine] = res.status;
    } catch {
      results[engine] = 0;
    }
  }

  return NextResponse.json({ submitted: urlList.length, results });
}
