import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow published properties listing (public map data)
  if (isPublishedPropertiesRequest(request)) {
    return NextResponse.next();
  }

  // Check for session cookie on protected paths
  const token = request.cookies.get("session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
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
