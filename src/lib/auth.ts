import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const COOKIE_NAME = "session";
// 1 day — short-lived session to limit the window where a revoked account
// (isActive=false) can still use a pre-existing token. Clients refresh by
// re-authenticating.
const COOKIE_MAX_AGE = 60 * 60 * 24;

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  agencyId: string;
  firstName: string;
  lastName: string;
}

/**
 * Create a JWT token for the given payload.
 * Returns the token string — the caller is responsible for setting the cookie.
 * Use `setSessionCookie` to apply it on a NextResponse, or `setSessionCookieFromServerAction`
 * when calling from a Server Action / Server Component.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

/** Session cookie options shared between route handlers and server actions. */
export const SESSION_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Session + live "isActive" check. Use this on sensitive endpoints (admin,
 * write actions) to immediately reject users whose accounts have been
 * deactivated, even if their JWT is still valid.
 *
 * Returns null if:
 *   - no cookie / invalid JWT
 *   - user no longer exists
 *   - user.isActive is false
 */
export async function getActiveSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, role: true },
  });
  if (!user || !user.isActive) return null;

  // If the role changed in DB, honour the DB value (defence-in-depth)
  if (user.role !== session.role) {
    return { ...session, role: user.role };
  }
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function requireRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  DIRIGEANT: 90,
  ASSOCIE: 80,
  MANAGER: 70,
  AGENT: 50,
  ASSISTANT: 30,
  CLIENT: 10,
};

export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}
