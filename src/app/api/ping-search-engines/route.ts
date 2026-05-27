import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.APP_URL || "https://retail-avenue.fr";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

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

  return NextResponse.json({ sitemap: SITEMAP_URL, results });
}
