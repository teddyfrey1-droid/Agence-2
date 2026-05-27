const SITE_URL = process.env.APP_URL || "https://retail-avenue.fr";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
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

export async function pingSearchEngines() {
  const pingUrls = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];

  const results: Record<string, number> = {};
  for (const url of pingUrls) {
    try {
      const res = await fetch(url);
      results[url] = res.status;
    } catch {
      results[url] = 0;
    }
  }
  console.log("[seo-ping] Search engine ping results:", results);
  return results;
}

export async function submitIndexNow() {
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
  console.log("[seo-ping] IndexNow results:", results);
  return { submitted: urlList.length, results };
}
