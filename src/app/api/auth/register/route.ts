import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { applyRateLimit, REGISTER_RATE_LIMIT } from "@/lib/rate-limit";

const registerSchema = z.object({
  firstName: z.string().min(2, "Prénom requis (2 car. min)"),
  lastName: z.string().min(2, "Nom requis (2 car. min)"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per hour per IP
    const rateLimited = applyRateLimit("auth-register", request.headers, REGISTER_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { firstName, lastName, email, phone, company, password } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "CLIENT",
      },
    });

    // Auto-login after registration
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId || "",
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entity: "user",
        entityId: user.id,
        details: `Inscription client: ${firstName} ${lastName}`,
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, {
      httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
      secure: SESSION_COOKIE_OPTIONS.secure,
      sameSite: SESSION_COOKIE_OPTIONS.sameSite,
      maxAge: SESSION_COOKIE_OPTIONS.maxAge,
      path: SESSION_COOKIE_OPTIONS.path,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
