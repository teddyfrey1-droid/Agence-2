import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
