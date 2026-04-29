import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * CSP is intentionally conservative but still permissive enough for the
 * stack we're using:
 *  - Next.js dev + inline styles require 'unsafe-inline' on style-src
 *  - Leaflet (carte page) is now bundled locally; tiles still come from
 *    OpenStreetMap / Carto, hence those hosts on connect-src + img-src
 *  - Supabase storage is used for media -> its bucket hostname is allowed
 *
 * `Content-Security-Policy-Report-Only` can be toggled via the CSP_REPORT_ONLY
 * env var — useful during rollout before flipping to enforcing mode.
 */
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    // Next.js inlines bootstrapping scripts; 'unsafe-inline' is unavoidable
    // unless we wire up nonces via middleware.
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.supabase.co",
    "https://*.tile.openstreetmap.org",
    "https://*.basemaps.cartocdn.com",
  ],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    // OpenStreetMap + Carto tiles used by the Leaflet carte
    "https://*.tile.openstreetmap.org",
    "https://*.basemaps.cartocdn.com",
    ...(isDev ? ["ws:", "wss:"] : []),
  ],
  "worker-src": ["'self'", "blob:"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
};

function buildCsp(): string {
  return Object.entries(cspDirectives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

const securityHeaders = [
  {
    key:
      process.env.CSP_REPORT_ONLY === "true"
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy",
    value: buildCsp(),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/**
 * Build the list of hosts allowed for `next/image` optimisation.
 *
 * Supabase Storage is the canonical source for property media. We extract
 * the hostname from `NEXT_PUBLIC_SUPABASE_URL` so deployments only allow
 * their own bucket — and never every HTTPS source on the internet.
 *
 * `NEXT_PUBLIC_IMAGE_HOSTS` (comma-separated) is an escape hatch for
 * additional CDNs (e.g. legacy Cloudinary) without changing this file.
 */
function imageRemotePatterns() {
  const hosts = new Set<string>();
  try {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabase) hosts.add(new URL(supabase).hostname);
  } catch {
    /* invalid URL — ignore */
  }
  for (const host of (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",")) {
    const trimmed = host.trim();
    if (trimmed) hosts.add(trimmed);
  }
  if (hosts.size === 0) {
    // Wildcard fallback for *.supabase.co so dev/preview without env vars
    // still load images. Production should set NEXT_PUBLIC_SUPABASE_URL.
    hosts.add("*.supabase.co");
  }
  return Array.from(hosts).map((hostname) => ({
    protocol: "https" as const,
    hostname,
  }));
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
