import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Block seeding in production unless explicitly forced
  if (process.env.NODE_ENV === "production" && !process.env.FORCE_SEED) {
    console.warn("[SEED] Seeding is disabled in production. Set FORCE_SEED=true to override.");
    return;
  }

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

  // Use environment variables for credentials, generate strong random passwords as fallback
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@agence-immo.fr";
  const agentEmail = process.env.SEED_AGENT_EMAIL || "agent@agence-immo.fr";

  // In dev, use provided password or generate a random one (never use "admin123")
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString("base64url");
  const agentPassword = process.env.SEED_AGENT_PASSWORD || crypto.randomBytes(16).toString("base64url");

  // Create admin user
  const adminHash = await hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "Système",
      role: "SUPER_ADMIN",
      isActivated: true,
      agencyId: agency.id,
      teamId: team.id,
    },
  });

  // Create sample agent
  const agentHash = await hash(agentPassword, 12);
  await prisma.user.upsert({
    where: { email: agentEmail },
    update: { passwordHash: agentHash },
    create: {
      email: agentEmail,
      passwordHash: agentHash,
      firstName: "Marie",
      lastName: "Dupont",
      role: "AGENT",
      isActivated: true,
      agencyId: agency.id,
      teamId: team.id,
    },
  });

  console.log("Seed completed!");
  console.log(`  Admin: ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? "(env password)" : adminPassword}`);
  console.log(`  Agent: ${agentEmail} / ${process.env.SEED_AGENT_PASSWORD ? "(env password)" : agentPassword}`);

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn("\n  [WARNING] Random passwords were generated. Set SEED_ADMIN_PASSWORD and SEED_AGENT_PASSWORD env vars for reproducible credentials.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
