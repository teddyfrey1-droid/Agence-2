import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
  await prisma.user.upsert({
    where: { email: "admin@agence-immo.fr" },
    update: {},
    create: {
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
  await prisma.user.upsert({
    where: { email: "agent@agence-immo.fr" },
    update: {},
    create: {
      email: "agent@agence-immo.fr",
      passwordHash: agentHash,
      firstName: "Marie",
      lastName: "Dupont",
      role: "AGENT",
      agencyId: agency.id,
      teamId: team.id,
    },
  });

  console.log("Seed completed!");
  console.log("  Admin: admin@agence-immo.fr / admin123");
  console.log("  Agent: agent@agence-immo.fr / agent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
