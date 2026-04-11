import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

/**
 * Setup endpoint — protected by SETUP_SECRET_TOKEN environment variable.
 * Only works when no admin user exists yet (first-time setup).
 * Requires explicit admin credentials via request body.
 *
 * Usage:
 *   POST /api/setup
 *   Headers: { "x-setup-token": "<SETUP_SECRET_TOKEN>" }
 *   Body: { "adminEmail": "...", "adminPassword": "...", "firstName": "...", "lastName": "..." }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require SETUP_SECRET_TOKEN to be configured
    const setupToken = process.env.SETUP_SECRET_TOKEN;
    if (!setupToken || setupToken.length < 16) {
      return NextResponse.json(
        { error: "Setup non disponible. Configurez SETUP_SECRET_TOKEN (min 16 caractères) dans les variables d'environnement." },
        { status: 403 }
      );
    }

    // 2. Validate the token from request header
    const providedToken = request.headers.get("x-setup-token");
    if (!providedToken || providedToken !== setupToken) {
      return NextResponse.json(
        { error: "Token de setup invalide" },
        { status: 403 }
      );
    }

    // 3. Block if any admin already exists (one-time setup only)
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Un administrateur existe déjà. Le setup initial a déjà été effectué." },
        { status: 409 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const { adminEmail, adminPassword, firstName, lastName } = body;

    if (!adminEmail || !adminPassword || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Champs requis : adminEmail, adminPassword, firstName, lastName" },
        { status: 400 }
      );
    }

    // 5. Enforce strong password policy
    if (adminPassword.length < 12) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 12 caractères" },
        { status: 400 }
      );
    }

    const weakPasswords = ["admin123", "password", "123456789012", "admin1234567"];
    if (weakPasswords.includes(adminPassword.toLowerCase())) {
      return NextResponse.json(
        { error: "Ce mot de passe est trop courant. Choisissez un mot de passe plus sécurisé." },
        { status: 400 }
      );
    }

    // Require at least one uppercase, one lowercase, and one digit
    if (!/[a-z]/.test(adminPassword) || !/[A-Z]/.test(adminPassword) || !/\d/.test(adminPassword)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre" },
        { status: 400 }
      );
    }

    // 6. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // 7. Create agency, team, and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.upsert({
        where: { id: "agency-main" },
        update: {},
        create: {
          id: "agency-main",
          name: "Agence Immobilière",
          legalName: "Agence Immobilière SAS",
          city: "Paris",
          email: "contact@agence-immo.fr",
          phone: "01 00 00 00 00",
        },
      });

      const team = await tx.team.upsert({
        where: { id: "team-commercial" },
        update: {},
        create: {
          id: "team-commercial",
          name: "Équipe Commerciale",
          agencyId: agency.id,
        },
      });

      const passwordHash = await hash(adminPassword, 12);
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName,
          lastName,
          role: "SUPER_ADMIN",
          isActivated: true,
          agencyId: agency.id,
          teamId: team.id,
        },
      });

      return { agencyId: agency.id, adminId: admin.id, adminEmail: admin.email };
    });

    return NextResponse.json({
      message: "Setup terminé avec succès",
      adminEmail: result.adminEmail,
    }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Erreur lors du setup" },
      { status: 500 }
    );
  }
}

// Disable GET — setup must be a deliberate POST action
export async function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée. Utilisez POST avec le header x-setup-token." },
    { status: 405 }
  );
}
