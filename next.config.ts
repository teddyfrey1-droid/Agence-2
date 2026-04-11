import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * CSP is intentionally conservative but still permissive enough for the
 * stack we're using:
 *  - Next.js dev + inline styles require 'unsafe-inline' on style-src
 *  - mapbox-gl uses blob: workers + WebGL, hence worker-src blob:
 *  - Supabase storage is used for media -> its bucket hostname is allowed
 *    via https: and data: on img-src
 *  - Brevo tracking is not used, Google Fonts neither.
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
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://*.tiles.mapbox.com",
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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverActions: {
    bodySizeLimit: "4mb",
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
