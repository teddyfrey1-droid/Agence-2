import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS, getSession, bumpTokenVersion } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Bump the user's tokenVersion so any other JWT issued before now (e.g.
  // a stolen cookie still in the wild) is rejected by getActiveSession().
  // Failure here must not block the logout itself.
  try {
    const session = await getSession();
    if (session) await bumpTokenVersion(session.userId);
  } catch {
    /* swallow */
  }

  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Delete the session cookie by setting it expired
  response.cookies.set(SESSION_COOKIE_OPTIONS.name, "", {
    httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
    secure: SESSION_COOKIE_OPTIONS.secure,
    sameSite: SESSION_COOKIE_OPTIONS.sameSite,
    maxAge: 0,
    path: SESSION_COOKIE_OPTIONS.path,
  });

  return response;
}
