import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const isDev = process.env.NODE_ENV !== "production";

/**
 * Build a strict CSP using a per-request nonce + 'strict-dynamic'.
 * Modern browsers ignore 'unsafe-inline' when a nonce is present, so we
 * keep it only as a fallback for legacy browsers (CSP3 spec).
 *
 * Cloudflare Turnstile (`challenges.cloudflare.com`) is whitelisted on
 * script-src / frame-src / connect-src — only loaded when the site key
 * env var is set, but the directive must be present so the browser can
 * fetch the API JS even before the widget mounts.
 */
function buildCspWithNonce(nonce: string): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Legacy fallback — ignored when nonce + strict-dynamic are honored
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
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
      "https://*.tile.openstreetmap.org",
      "https://*.basemaps.cartocdn.com",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": ["'self'", "https://challenges.cloudflare.com"],
    "worker-src": ["'self'", "blob:"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

const cspHeaderName =
  process.env.CSP_REPORT_ONLY === "true"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

function withCspNonce(response: NextResponse, nonce: string): NextResponse {
  response.headers.set(cspHeaderName, buildCspWithNonce(nonce));
  return response;
}

const publicPaths = [
  "/",
  "/agence",
  "/biens",
  "/contact",
  "/recherche-local",
  "/proposer-bien",
  "/login",
  "/inscription",
  "/activation",
  "/mot-de-passe-oublie",
  "/reinitialisation-mot-de-passe",
];

const publicApiPaths = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/activate",
  "/api/contacts/public",
  "/api/search-requests/public",
  "/api/properties/public",
  "/api/property-shares/",
  "/api/setup",
];

function isPublicPath(pathname: string): boolean {
  // Exact match on known public pages
  if (publicPaths.includes(pathname)) return true;

  // Property detail pages are public
  if (pathname.startsWith("/biens/")) return true;

  // Panel QR landing (public — scanners are anonymous prospects)
  if (pathname.startsWith("/panneau/")) return true;

  // Next.js internals
  if (pathname.startsWith("/_next")) return true;

  // Static files
  if (/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|webmanifest)$/.test(pathname)) return true;

  // Public API paths (exact prefix match)
  if (publicApiPaths.some((p) => pathname.startsWith(p))) return true;

  return false;
}

/**
 * Check if a properties API request is for the published properties endpoint.
 * Only allows GET requests with query parameter published=true on exact path.
 */
function isPublishedPropertiesRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (pathname !== "/api/properties") return false;
  if (request.method !== "GET") return false;
  return request.nextUrl.searchParams.get("published") === "true";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a per-request nonce. Even API responses get the header — it's
  // harmless on JSON and keeps the code path simple. Server components read
  // the nonce via headers().get('x-nonce').
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const passThrough = () =>
    withCspNonce(NextResponse.next({ request: { headers: requestHeaders } }), nonce);

  // Allow public paths
  if (isPublicPath(pathname)) {
    return passThrough();
  }

  // Allow published properties listing (public map data)
  if (isPublishedPropertiesRequest(request)) {
    return passThrough();
  }

  // Check for session cookie on protected paths.
  // `__Host-session` in prod / `session` in dev — see src/lib/auth.ts.
  // We read both during the rollout window so users with legacy cookies
  // aren't logged out abruptly.
  const cookieName =
    process.env.NODE_ENV === "production" ? "__Host-session" : "session";
  const token =
    request.cookies.get(cookieName)?.value ??
    request.cookies.get("session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return passThrough();
  } catch {
    // Invalid token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Session expirée" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
