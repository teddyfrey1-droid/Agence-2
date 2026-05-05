import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * CSP is set per-request by middleware.ts (with a nonce + 'strict-dynamic')
 * — see `buildCspWithNonce`. We only ship the static, non-CSP headers from
 * here so they apply to static assets that bypass middleware too.
 */
const securityHeaders = [
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
    formats: ["image/avif", "image/webp"],
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
