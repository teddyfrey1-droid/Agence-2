import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

const schema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "6 caractères minimum"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Données invalides" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const validPassword = await compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CHANGE_PASSWORD",
        entity: "user",
        entityId: user.id,
        details: "Mot de passe modifié par l'utilisateur",
      },
    });

    return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
