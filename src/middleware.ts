import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!"
);

const publicPaths = [
  "/",
  "/agence",
  "/biens",
  "/contact",
  "/recherche-local",
  "/proposer-bien",
  "/login",
];

const publicApiPaths = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/contacts/public",
  "/api/search-requests/public",
  "/api/properties/public",
];

function isPublicPath(pathname: string): boolean {
  // Exact match or starts with public path + /
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/biens/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/properties") && pathname.includes("published")) return true;
  if (publicApiPaths.some((p) => pathname.startsWith(p))) return true;
  if (/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
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
