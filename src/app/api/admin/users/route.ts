import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvitationEmail } from "@/lib/email";

const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "DIRIGEANT", "ASSOCIE", "MANAGER", "AGENT", "ASSISTANT", "CLIENT"]),
  teamId: z.string().optional(),
  sendInvitation: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Données invalides" }, { status: 400 });
    }

    const { email, password, firstName, lastName, phone, role, teamId, sendInvitation } = parsed.data;

    // If no invitation and no password, require password
    if (!sendInvitation && !password) {
      return NextResponse.json({ error: "Mot de passe requis (ou envoyer une invitation)" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un utilisateur existe déjà avec cet email" }, { status: 409 });
    }

    // If invitation mode, generate a temporary random password
    const actualPassword = password || randomBytes(16).toString("hex");
    const passwordHash = await hash(actualPassword, 12);

    let invitationToken: string | null = null;
    let invitationExpiresAt: Date | null = null;

    if (sendInvitation) {
      invitationToken = randomBytes(32).toString("hex");
      invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: role as any,
        agencyId: role === "CLIENT" ? undefined : session.agencyId,
        teamId: teamId || undefined,
        isActivated: sendInvitation ? false : true,
        invitationToken,
        invitationExpiresAt,
        invitedAt: sendInvitation ? new Date() : undefined,
      },
    });

    if (sendInvitation && invitationToken) {
      await sendInvitationEmail(email, firstName, invitationToken);
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CREATE_USER",
        entity: "user",
        entityId: user.id,
        details: `Création utilisateur: ${firstName} ${lastName} (${role})${sendInvitation ? " - invitation envoyée" : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      invitationSent: !!sendInvitation,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
