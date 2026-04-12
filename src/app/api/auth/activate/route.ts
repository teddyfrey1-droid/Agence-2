import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Données invalides" }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Lien d'invitation invalide ou expiré" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActivated: true,
        isActive: true,
        invitationToken: null,
        invitationExpiresAt: null,
      },
    });

    await sendWelcomeEmail(user.email, user.firstName);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ACTIVATE_ACCOUNT",
        entity: "user",
        entityId: user.id,
        details: "Compte activé via invitation",
      },
    });

    return NextResponse.json({ success: true, message: "Compte activé avec succès" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
