import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: "admin@agence-immo.fr" },
    });

    if (existing) {
      return NextResponse.json({ message: "Admin existe déjà", ok: true });
    }

    // Create agency
    const agency = await prisma.agency.upsert({
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

    // Create team
    const team = await prisma.team.upsert({
      where: { id: "team-commercial" },
      update: {},
      create: {
        id: "team-commercial",
        name: "Équipe Commerciale",
        agencyId: agency.id,
      },
    });

    // Create admin user
    const passwordHash = await hash("admin123", 12);
    await prisma.user.create({
      data: {
        email: "admin@agence-immo.fr",
        passwordHash,
        firstName: "Admin",
        lastName: "Système",
        role: "SUPER_ADMIN",
        agencyId: agency.id,
        teamId: team.id,
      },
    });

    // Create sample agent
    const agentHash = await hash("agent123", 12);
    await prisma.user.create({
      data: {
        email: "agent@agence-immo.fr",
        passwordHash: agentHash,
        firstName: "Marie",
        lastName: "Dupont",
        role: "AGENT",
        agencyId: agency.id,
        teamId: team.id,
      },
    });

    return NextResponse.json({
      message: "Setup terminé ! Connectez-vous avec admin@agence-immo.fr",
      ok: true,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Erreur lors du setup" },
      { status: 500 }
    );
  }
}
