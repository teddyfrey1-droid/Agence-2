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

  // If a password was explicitly provided, refuse weak values. Random
  // fallbacks are 22 chars base64url so they always pass — this only
  // catches user-supplied env values.
  const weakPasswords = new Set([
    "admin123", "agent123", "password", "password123", "azerty", "azerty123",
    "123456", "123456789", "12345678", "qwerty", "qwerty123", "letmein",
    "admin", "agent", "test", "test123",
  ]);
  function assertStrong(label: string, value: string, fromEnv: boolean) {
    if (!fromEnv) return;
    if (value.length < 12) {
      throw new Error(`[SEED] ${label} doit faire au moins 12 caractères`);
    }
    if (weakPasswords.has(value.toLowerCase())) {
      throw new Error(`[SEED] ${label} est trop courant — choisis un mot de passe fort`);
    }
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
      throw new Error(`[SEED] ${label} doit mélanger majuscule, minuscule et chiffre`);
    }
  }
  assertStrong("SEED_ADMIN_PASSWORD", adminPassword, !!process.env.SEED_ADMIN_PASSWORD);
  assertStrong("SEED_AGENT_PASSWORD", agentPassword, !!process.env.SEED_AGENT_PASSWORD);

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
