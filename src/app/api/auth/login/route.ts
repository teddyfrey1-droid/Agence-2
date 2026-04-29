import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, verifyPassword, updateUserLastLogin } from "@/modules/users";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, LOGIN_RATE_LIMIT } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const rateLimited = await applyRateLimit("auth-login", request.headers, LOGIN_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await findUserByEmail(email);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId || "",
      firstName: user.firstName,
      lastName: user.lastName,
      tv: user.tokenVersion,
    });

    await updateUserLastLogin(user.id);

    // Track login activity (non-blocking, don't fail login if tracking fails)
    prisma.userActivity.create({
      data: {
        userId: user.id,
        type: "LOGIN",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    }).catch(() => {});

    // Set the session cookie on the response
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, {
      httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
      secure: SESSION_COOKIE_OPTIONS.secure,
      sameSite: SESSION_COOKIE_OPTIONS.sameSite,
      maxAge: SESSION_COOKIE_OPTIONS.maxAge,
      path: SESSION_COOKIE_OPTIONS.path,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
